package db

import (
	"log"

	"github.com/MurkaDIasamidze/Jobscheduler-/internal/config"
	"github.com/MurkaDIasamidze/Jobscheduler-/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type DB struct {
	GORM *gorm.DB
}

func New(cfg *config.Config) *DB {
	gdb, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database:", err)
	}
	if err := gdb.AutoMigrate(&models.User{}, &models.Job{}, &models.Execution{}); err != nil {
		log.Fatal("auto migrate error:", err)
	}
	log.Println("Database connected & migrated.")
	return &DB{GORM: gdb}
}