package models

import (
	"strings"
	"time"

	"gorm.io/gorm"
)

type Job struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"not null" json:"name"`
	Commands    []string       `gorm:"-" json:"commands"`
	CommandsRaw string         `gorm:"type:text" json:"commands_raw"`
	Schedule    string         `gorm:"not null" json:"schedule"`
	RunAt       *time.Time     `json:"run_at"`
	Enabled     bool           `gorm:"default:true" json:"enabled"`
	LastRunAt   *time.Time     `json:"last_run_at"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// AfterFind hook to deserialize CommandsRaw into Commands array
func (j *Job) AfterFind(tx *gorm.DB) error {
	if j.CommandsRaw != "" {
		j.Commands = strings.Split(j.CommandsRaw, "\n")
	}
	return nil
}

// BeforeSave hook to serialize Commands array into CommandsRaw
func (j *Job) BeforeSave(tx *gorm.DB) error {
	if len(j.Commands) > 0 {
		j.CommandsRaw = strings.Join(j.Commands, "\n")
	}
	return nil
}

type Execution struct {
	ID         uint       `gorm:"primaryKey" json:"id"`
	JobID      uint       `gorm:"index" json:"job_id"`
	StartedAt  time.Time  `json:"started_at"`
	FinishedAt *time.Time `json:"finished_at"`
	Success    bool       `json:"success"`
	Output     string     `gorm:"type:text" json:"output"`
	CreatedAt  time.Time  `json:"created_at"`
}

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	Email     string         `gorm:"unique;not null" json:"email"`
	Password  string         `gorm:"not null" json:"-"`
	Role      string         `gorm:"default:user" json:"role"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}