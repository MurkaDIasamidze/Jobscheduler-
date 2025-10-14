package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"

	"github.com/yourusername/jobscheduler-go/internal/handlers"
)

func Setup(app *fiber.App, h *handlers.Handler) {
	app.Use(cors.New())

	api := app.Group("/api")

	api.Post("/auth/register", h.Register)
	api.Post("/auth/login", h.Login)

	protected := api.Group("/", h.AuthMiddleware)
	protected.Get("/jobs", h.ListJobs)
	protected.Post("/jobs", h.CreateJob)
	protected.Post("/jobs/:id/run", h.RunJobNow)
}
