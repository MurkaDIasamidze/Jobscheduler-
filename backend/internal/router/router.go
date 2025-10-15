package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"

	"github.com/yourusername/jobscheduler-go/internal/handlers"
)

func Setup(app *fiber.App, h *handlers.Handler) {
	app.Use(cors.New())

	api := app.Group("/api")

	// Auth routes
	api.Post("/auth/register", h.Register)
	api.Post("/auth/login", h.Login)

	// Protected routes
	protected := api.Group("/", h.AuthMiddleware)

	// Job routes
	protected.Get("/jobs", h.ListJobs)
	protected.Post("/jobs", h.CreateJob)
	protected.Put("/jobs/:id", h.UpdateJob)
	protected.Delete("/jobs/:id", h.DeleteJob)
	protected.Post("/jobs/:id/run", h.RunJobNow)

	// User & execution routes
	protected.Get("/users", h.ListUsers)
	protected.Get("/executions", h.ListExecutions)
}
