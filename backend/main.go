package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/yourusername/jobscheduler-go/internal/config"
	"github.com/yourusername/jobscheduler-go/internal/db"
	"github.com/yourusername/jobscheduler-go/internal/handlers"
	"github.com/yourusername/jobscheduler-go/internal/router"
	"github.com/yourusername/jobscheduler-go/internal/scheduler"
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
