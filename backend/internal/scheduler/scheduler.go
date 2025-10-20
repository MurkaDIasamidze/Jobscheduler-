package scheduler

import (
	"context"
	"log"
	"os/exec"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/robfig/cron/v3"
	"github.com/MurkaDIasamidze/Jobscheduler-/internal/db"
	"github.com/MurkaDIasamidze/Jobscheduler-/internal/models"
)

type Scheduler struct {
	db       *db.DB
	cron     *cron.Cron
	jobs     map[int64]cron.EntryID
	onceJobs map[int64]*time.Timer
	mu       sync.Mutex
	ctx      context.Context
	cancel   context.CancelFunc
}

func New(d *db.DB) *Scheduler {
	ctx, cancel := context.WithCancel(context.Background())
	return &Scheduler{
		db:       d,
		cron:     cron.New(cron.WithSeconds()),
		jobs:     make(map[int64]cron.EntryID),
		onceJobs: make(map[int64]*time.Timer),
		ctx:      ctx,
		cancel:   cancel,
	}
}

func (s *Scheduler) LoadAndStart() error {
	var jobs []models.Job
	if err := s.db.GORM.Where("enabled = ?", true).Find(&jobs).Error; err != nil {
		return err
	}

	for i := range jobs {
		_ = s.ScheduleJob(&jobs[i])
	}

	s.cron.Start()
	log.Printf("scheduler started with %d cron jobs and %d one-time jobs", len(s.jobs), len(s.onceJobs))
	return nil
}

func (s *Scheduler) Stop() {
	s.cancel()
	ctx := s.cron.Stop()
	<-ctx.Done()
}

func (s *Scheduler) ScheduleJob(j *models.Job) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := int64(j.ID)

	if eID, ok := s.jobs[id]; ok {
		s.cron.Remove(eID)
		delete(s.jobs, id)
	}
	if t, ok := s.onceJobs[id]; ok {
		t.Stop()
		delete(s.onceJobs, id)
	}

	if !j.Enabled {
		return nil
	}

	if j.RunAt != nil && j.RunAt.After(time.Now()) {
		duration := time.Until(*j.RunAt)
		timer := time.AfterFunc(duration, func() {
			s.runJob(j.ID)
			s.mu.Lock()
			delete(s.onceJobs, id)
			s.mu.Unlock()
		})
		s.onceJobs[id] = timer
		log.Printf("scheduled one-time job %d at %s", j.ID, j.RunAt.String())
		return nil
	}

	if j.Schedule != "" {
		entryID, err := s.cron.AddFunc(j.Schedule, func() { s.runJob(j.ID) })
		if err != nil {
			return err
		}
		s.jobs[id] = entryID
		log.Printf("scheduled cron job %d -> entry %v (expr: %s)", j.ID, entryID, j.Schedule)
	}

	return nil
}

func (s *Scheduler) Remove(jobID int64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if eID, ok := s.jobs[jobID]; ok {
		s.cron.Remove(eID)
		delete(s.jobs, jobID)
	}
	if t, ok := s.onceJobs[jobID]; ok {
		t.Stop()
		delete(s.onceJobs, jobID)
	}
	log.Printf("removed job %d from scheduler", jobID)
}

func (s *Scheduler) RunJobNow(j *models.Job) (*models.Execution, error) {
	exec := &models.Execution{
		JobID:     j.ID,
		StartedAt: time.Now(),
		CreatedAt: time.Now(),
	}
	if err := s.db.GORM.Create(exec).Error; err != nil {
		return nil, err
	}

	go s.executeCommands(exec.ID, j)
	return exec, nil
}

func (s *Scheduler) runJob(jobID uint) {
	var j models.Job
	if err := s.db.GORM.First(&j, jobID).Error; err != nil {
		log.Printf("job not found %d: %v", jobID, err)
		return
	}
	if !j.Enabled {
		log.Printf("job %d disabled; skipping", jobID)
		return
	}

	exec := &models.Execution{
		JobID:     j.ID,
		StartedAt: time.Now(),
		CreatedAt: time.Now(),
	}
	if err := s.db.GORM.Create(exec).Error; err != nil {
		log.Printf("failed create execution: %v", err)
		return
	}

	go s.executeCommands(exec.ID, &j)
}

func ExecuteCommand(cmdStr string) string {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	var cmd *exec.Cmd
	if isWindows() {
		cmd = exec.CommandContext(ctx, "cmd", "/C", cmdStr)
	} else {
		cmd = exec.CommandContext(ctx, "sh", "-c", cmdStr)
	}

	out, err := cmd.CombinedOutput()
	if err != nil {
		return string(out) + "\nError: " + err.Error()
	}
	return string(out)
}

func isWindows() bool {
	return strings.Contains(strings.ToLower(runtime.GOOS), "windows")
}

func (s *Scheduler) executeCommands(execID uint, j *models.Job) {
	commands := j.Commands
	if len(commands) == 0 && j.CommandsRaw != "" {
		commands = strings.Split(j.CommandsRaw, "\n")
	}

	var wg sync.WaitGroup
	var mu sync.Mutex
	outputs := []string{}
	success := true

	for _, cmdStr := range commands {
		cmdStr = strings.TrimSpace(cmdStr)
		if cmdStr == "" {
			continue
		}

		wg.Add(1)
		go func(c string) {
			defer wg.Done()
			ctx, cancel := context.WithTimeout(s.ctx, 5*time.Minute)
			defer cancel()

			var cmd *exec.Cmd
			if isWindows() {
				cmd = exec.CommandContext(ctx, "cmd", "/C", c)
			} else {
				cmd = exec.CommandContext(ctx, "sh", "-c", c)
			}

			out, err := cmd.CombinedOutput()
			mu.Lock()
			outputs = append(outputs, string(out))
			if err != nil {
				success = false
				outputs = append(outputs, err.Error())
			}
			mu.Unlock()
		}(cmdStr)
	}

	wg.Wait()
	finished := time.Now()

	var execRec models.Execution
	if err := s.db.GORM.First(&execRec, execID).Error; err != nil {
		log.Printf("failed load exec record: %v", err)
		return
	}
	execRec.FinishedAt = &finished
	execRec.Output = strings.Join(outputs, "\n")
	execRec.Success = success

	if err := s.db.GORM.Save(&execRec).Error; err != nil {
		log.Printf("failed update exec: %v", err)
	}

	now := time.Now()
	j.LastRunAt = &now
	if err := s.db.GORM.Save(j).Error; err != nil {
		log.Printf("failed update job last run: %v", err)
	}

	if success {
		log.Printf("job %d executed successfully; output len=%d", j.ID, len(execRec.Output))
	} else {
		log.Printf("job %d execution failed; output len=%d", j.ID, len(execRec.Output))
	}
}