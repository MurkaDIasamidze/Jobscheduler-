package db

import (
    "fmt"
    "log"

    "github.com/yourusername/jobscheduler-go/internal/config"
    "github.com/yourusername/jobscheduler-go/internal/models"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

type DB struct {
    GORM *gorm.DB
}

func New(cfg *config.Config) (*DB, error) {
    dsn := cfg.DatabaseURL
    gdb, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        return nil, err
    }

    // AutoMigrate models
    if err := gdb.AutoMigrate(&models.Job{}, &models.Execution{}); err != nil {
        return nil, fmt.Errorf("auto migrate: %w", err)
    }

    log.Println("db connected and migrated")
    return &DB{GORM: gdb}, nil
}

func (db *DB) Close() error {
    sqlDB, err := db.GORM.DB()
    if err != nil {
        return err
    }
    return sqlDB.Close()
}
