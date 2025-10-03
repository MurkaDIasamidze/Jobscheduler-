package scheduler

import (
    "context"
    "log"
    "os/exec"
    "sync"
    "time"

    "github.com/robfig/cron/v3"
    "github.com/yourusername/jobscheduler-go/internal/db"
    "github.com/yourusername/jobscheduler-go/internal/models"
)


type Scheduler struct {
    db     *db.DB
    cron   *cron.Cron
    // mapping jobID -> cron.EntryID
    jobs   map[int64]cron.EntryID
    mu     sync.Mutex
    ctx    context.Context
    cancel context.CancelFunc
}

func New(d *db.DB) *Scheduler {
    ctx, cancel := context.WithCancel(context.Background())
    return &Scheduler{
        db:     d,
        cron:   cron.New(cron.WithSeconds()), // support second-level entries
        jobs:   make(map[int64]cron.EntryID),
        ctx:    ctx,
        cancel: cancel,
    }
}

func (s *Scheduler) LoadAndStart() error {
    // load enabled jobs
    var jobs []models.Job
    if err := s.db.GORM.Where("enabled = ?", true).Find(&jobs).Error; err != nil {
        return err
    }

    for i := range jobs {
        _ = s.ScheduleJob(&jobs[i])
    }
    s.cron.Start()
    log.Printf("scheduler started with %d jobs", len(s.jobs))
    return nil
}

func (s *Scheduler) Stop() {
    s.cancel()
    // stop cron gracefully
    ctx := s.cron.Stop()
    <-ctx.Done()
}

func (s *Scheduler) ScheduleJob(j *models.Job) error {
    s.mu.Lock()
    defer s.mu.Unlock()

    id := int64(j.ID)
    // remove previous if present
    if eID, ok := s.jobs[id]; ok {
        s.cron.Remove(eID)
        delete(s.jobs, id)
    }

    // support "once" special schedule? For simplicity, if schedule == "once" we don't schedule on cron.
    if j.Schedule == "" {
        return nil
    }

    // validate expression: if invalid, still store but return error
    // cron.AddFunc will return error for invalid expressions
    entryID, err := s.cron.AddFunc(j.Schedule, func() { s.runJob(j.ID) })
    if err != nil {
        return err
    }

    s.jobs[id] = entryID
    log.Printf("scheduled job %d -> entry %v (expr: %s)", j.ID, entryID, j.Schedule)
    return nil
}

func (s *Scheduler) RescheduleJob(j *models.Job) error {
    return s.ScheduleJob(j)
}

func (s *Scheduler) Remove(jobID int64) {
    s.mu.Lock()
    defer s.mu.Unlock()
    if eID, ok := s.jobs[jobID]; ok {
        s.cron.Remove(eID)
        delete(s.jobs, jobID)
        log.Printf("removed job %d from scheduler", jobID)
    }
}

func (s *Scheduler) RunJobNow(j *models.Job) (*models.Execution, error) {
    // run synchronously but don't block caller too long
    exec := &models.Execution{
        JobID:     j.ID,
        StartedAt: time.Now(),
        CreatedAt: time.Now(),
    }
    if err := s.db.GORM.Create(exec).Error; err != nil {
        return nil, err
    }

    // run in goroutine to allow async completion but return execution record
    go s.executeCommand(exec.ID, j)

    return exec, nil
}

func (s *Scheduler) runJob(jobID uint) {
    // fetch job
    var j models.Job
    if err := s.db.GORM.First(&j, jobID).Error; err != nil {
        log.Printf("runJob: job not found %d: %v", jobID, err)
        return
    }
    if !j.Enabled {
        log.Printf("job %d disabled; skipping", jobID)
        return
    }

    // create execution
    exec := &models.Execution{
        JobID:     j.ID,
        StartedAt: time.Now(),
        CreatedAt: time.Now(),
    }
    if err := s.db.GORM.Create(exec).Error; err != nil {
        log.Printf("failed create execution: %v", err)
        return
    }

    // run command
    s.executeCommand(exec.ID, &j)
}

func (s *Scheduler) executeCommand(execID uint, j *models.Job) {
    // simple execution: treat Command as shell command
    // This is potentially unsafe if commands come from untrusted sources.
    ctx, cancel := context.WithTimeout(s.ctx, 5*time.Minute)
    defer cancel()

    // prepare command - use `sh -c` so that complex commands work (on Unix)
    // On Windows you'd need to adapt to "cmd /C".
    cmd := exec.CommandContext(ctx, "sh", "-c", j.Command)

    out, err := cmd.CombinedOutput()
    finished := time.Now()

    // update execution
    var execRec models.Execution
    if err := s.db.GORM.First(&execRec, execID).Error; err != nil {
        log.Printf("failed load exec record: %v", err)
        return
    }
    execRec.FinishedAt = &finished
    execRec.Output = string(out)
    execRec.Success = err == nil

    if err := s.db.GORM.Save(&execRec).Error; err != nil {
        log.Printf("failed update exec: %v", err)
    }

    // update job last run
    now := time.Now()
    j.LastRunAt = &now
    if err := s.db.GORM.Save(j).Error; err != nil {
        log.Printf("failed update job last run: %v", err)
    }

    if err != nil {
        log.Printf("job %d execution failed: %v output:%s", j.ID, err, out)
    } else {
        log.Printf("job %d executed successfully; output len=%d", j.ID, len(out))
    }
}
