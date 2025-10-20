package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/MurkaDIasamidze/Jobscheduler-/internal/config"
	"github.com/MurkaDIasamidze/Jobscheduler-/internal/db"
	"github.com/MurkaDIasamidze/Jobscheduler-/internal/handlers"
	"github.com/MurkaDIasamidze/Jobscheduler-/internal/router"
	"github.com/MurkaDIasamidze/Jobscheduler-/internal/scheduler"
)

func main() {
	cfg := config.Load()
	database := db.New(cfg)
	sched := scheduler.New(database)
	go sched.LoadAndStart()

	h := &handlers.Handler{DB: database, Scheduler: sched, JWTSecret: cfg.JWTSecret}
	app := fiber.New()

	router.Setup(app, h)

	log.Printf("Server running on :%s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}
