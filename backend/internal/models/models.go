package models

import (
	"time"

	"gorm.io/gorm"
)

type Job struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	Commands  []string       `gorm:"-" json:"commands"`      // multiple commands, not stored in DB directly
	CommandsRaw string       `gorm:"type:text" json:"-"`    // serialized commands for DB
	Schedule  string         `gorm:"not null" json:"schedule"` // cron expression
	RunAt     *time.Time     `json:"run_at"`                  // exact one-time execution
	Enabled   bool           `gorm:"default:true" json:"enabled"`
	LastRunAt *time.Time     `json:"last_run_at"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
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

type Schedule struct {
	Year   int `json:"year"`
	Month  int `json:"month"`
	Day    int `json:"day"`
	Hour   int `json:"hour"`
	Minute int `json:"minute"`
}


type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	Email     string         `gorm:"unique;not null" json:"email"`
	Password  string         `gorm:"not null" json:"-"`
	Role      string         `gorm:"default:user" json:"role"` // "user" or "admin"
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
