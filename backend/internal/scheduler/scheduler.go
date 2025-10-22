package scheduler

import (
	"context"
	"log"
	"os/exec"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/MurkaDIasamidze/Jobscheduler-/internal/db"
	"github.com/MurkaDIasamidze/Jobscheduler-/internal/models"
)

type Scheduler struct {
	db       *db.DB
	jobQueue chan *models.Job
	workers  int
	mu       sync.Mutex
	onceJobs map[int64]*time.Timer
	ctx      context.Context
	cancel   context.CancelFunc
	wg       sync.WaitGroup
}

func New(d *db.DB, workers int) *Scheduler {
	ctx, cancel := context.WithCancel(context.Background())
	return &Scheduler{
		db:       d,
		jobQueue: make(chan *models.Job, 100),
		workers:  workers,
		onceJobs: make(map[int64]*time.Timer),
		ctx:      ctx,
		cancel:   cancel,
	}
}

// Start scheduler loop and worker pool
func (s *Scheduler) LoadAndStart() {
	s.startWorkers()

	var jobs []models.Job
	if err := s.db.GORM.Where("enabled = ?", true).Find(&jobs).Error; err != nil {
		log.Printf("failed to load jobs: %v", err)
		return
	}

	for i := range jobs {
		s.ScheduleJob(&jobs[i])
	}

	go s.schedulerLoop()
	log.Printf("scheduler started with %d jobs", len(jobs))
}

// Worker pool
func (s *Scheduler) startWorkers() {
	for i := 0; i < s.workers; i++ {
		s.wg.Add(1)
		go func(id int) {
			defer s.wg.Done()
			for {
				select {
				case job := <-s.jobQueue:
					s.executeJob(job)
				case <-s.ctx.Done():
					return
				}
			}
		}(i)
	}
}

// Scheduler loop: checks DB every minute
func (s *Scheduler) schedulerLoop() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-s.ctx.Done():
			return
		case now := <-ticker.C:
			s.checkAndEnqueueJobs(now)
		}
	}
}

// Check DB for due jobs
func (s *Scheduler) checkAndEnqueueJobs(now time.Time) {
	var jobs []models.Job
	if err := s.db.GORM.Where("enabled = ?", true).Find(&jobs).Error; err != nil {
		log.Printf("failed to load jobs: %v", err)
		return
	}

	for i := range jobs {
		j := &jobs[i]

		// One-time job
		if j.RunAt != nil && !j.RunAt.Before(now) {
			if _, exists := s.onceJobs[int64(j.ID)]; !exists {
				duration := time.Until(*j.RunAt)
				timer := time.AfterFunc(duration, func() {
					s.enqueueJob(j)
					s.mu.Lock()
					delete(s.onceJobs, int64(j.ID))
					j.Enabled = false
					_ = s.db.GORM.Save(j)
					s.mu.Unlock()
				})
				s.mu.Lock()
				s.onceJobs[int64(j.ID)] = timer
				s.mu.Unlock()
				log.Printf("scheduled one-time job %d at %s", j.ID, j.RunAt.Format(time.RFC3339))
			}
			continue
		}

		// Recurring job: enqueue every minute
		if j.Schedule != "" {
			s.enqueueJob(j)
		}
	}
}

// Public method to schedule a job immediately
func (s *Scheduler) ScheduleJob(j *models.Job) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.enqueueJob(j)
}

// Enqueue job into worker queue
func (s *Scheduler) enqueueJob(j *models.Job) {
	select {
	case s.jobQueue <- j:
		log.Printf("enqueued job %d for execution", j.ID)
	default:
		log.Printf("job queue full, job %d skipped", j.ID)
	}
}

// Remove job
func (s *Scheduler) Remove(jobID int64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if t, ok := s.onceJobs[jobID]; ok {
		t.Stop()
		delete(s.onceJobs, jobID)
	}
	log.Printf("removed job %d", jobID)
}

// Run job immediately
func (s *Scheduler) RunJobNow(j *models.Job) (*models.Execution, error) {
	execRec := &models.Execution{
		JobID:     j.ID,
		StartedAt: time.Now(),
		CreatedAt: time.Now(),
	}
	if err := s.db.GORM.Create(execRec).Error; err != nil {
		return nil, err
	}
	s.enqueueJob(j)
	return execRec, nil
}

// Execute job commands (workers)
func (s *Scheduler) executeJob(j *models.Job) {
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
			out := ExecuteCommand(c)
			mu.Lock()
			outputs = append(outputs, out)
			if strings.Contains(strings.ToLower(out), "error") {
				success = false
			}
			mu.Unlock()
		}(cmdStr)
	}

	wg.Wait()
	finished := time.Now()

	// Update execution record
	execRec := &models.Execution{}
	if err := s.db.GORM.Where("job_id = ?", j.ID).Order("created_at desc").First(execRec).Error; err != nil {
		log.Printf("failed to load execution record: %v", err)
		return
	}
	execRec.FinishedAt = &finished
	execRec.Output = strings.Join(outputs, "\n")
	execRec.Success = success
	_ = s.db.GORM.Save(execRec)

	// Update job last run
	j.LastRunAt = &finished
	_ = s.db.GORM.Save(j)

	if success {
		log.Printf("job %d executed successfully", j.ID)
	} else {
		log.Printf("job %d failed", j.ID)
	}
}

// Execute a single command
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

// Stop scheduler and all workers
func (s *Scheduler) Stop() {
	s.cancel()
	s.wg.Wait()
}
