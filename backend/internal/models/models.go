package models

import (
    "time"

    "gorm.io/gorm"
)

type Job struct {
    ID          uint           `gorm:"primaryKey" json:"id"`
    Name        string         `gorm:"not null" json:"name"`
    Schedule    string         `gorm:"not null" json:"schedule"` // cron expression or "once"
    Command     string         `gorm:"type:text" json:"command"`  // arbitrary command or payload
    Enabled     bool           `gorm:"default:true" json:"enabled"`
    LastRunAt   *time.Time     `json:"last_run_at"`
    CreatedAt   time.Time      `json:"created_at"`
    UpdatedAt   time.Time      `json:"updated_at"`
    DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type Execution struct {
    ID         uint      `gorm:"primaryKey" json:"id"`
    JobID      uint      `gorm:"index" json:"job_id"`
    StartedAt  time.Time `json:"started_at"`
    FinishedAt *time.Time `json:"finished_at"`
    Success    bool      `json:"success"`
    Output     string    `gorm:"type:text" json:"output"`
    CreatedAt  time.Time `json:"created_at"`
}
