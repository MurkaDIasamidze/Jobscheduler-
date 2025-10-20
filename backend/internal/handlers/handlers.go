package handlers

import (
	"log"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/MurkaDIasamidze/Jobscheduler-/internal/db"
	"github.com/MurkaDIasamidze/Jobscheduler-/internal/models"
	"github.com/MurkaDIasamidze/Jobscheduler-/internal/scheduler"
)

type Handler struct {
	DB        *db.DB
	Scheduler *scheduler.Scheduler
	JWTSecret string
}

// ---- HEALTH CHECK ----
func (h *Handler) HealthCheck(c *fiber.Ctx) error {
	// Check database connection
	sqlDB, err := h.DB.GORM.DB()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status": "error",
			"error":  "Database connection failed",
		})
	}

	if err := sqlDB.Ping(); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status": "error",
			"error":  "Database ping failed",
		})
	}

	return c.JSON(fiber.Map{
		"status":   "ok",
		"database": "connected",
		"time":     time.Now(),
	})
}

// ---- AUTH ----
func (h *Handler) Register(c *fiber.Ctx) error {
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	hashed, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	user := models.User{Name: req.Name, Email: req.Email, Password: string(hashed), Role: "user"}
	if err := h.DB.GORM.Create(&user).Error; err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Email already exists"})
	}
	return c.Status(201).JSON(user)
}

func (h *Handler) Login(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	var user models.User
	if err := h.DB.GORM.Where("email = ?", req.Email).First(&user).Error; err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	})

	t, _ := token.SignedString([]byte(h.JWTSecret))
	return c.JSON(fiber.Map{"token": t})
}

func (h *Handler) AuthMiddleware(c *fiber.Ctx) error {
	auth := c.Get("Authorization")
	if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
		return c.Status(401).JSON(fiber.Map{"error": "Missing token"})
	}
	tokenStr := strings.TrimPrefix(auth, "Bearer ")

	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		return []byte(h.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
	}
	return c.Next()
}

// ---- JOBS ----
func (h *Handler) ListJobs(c *fiber.Ctx) error {
	var jobs []models.Job
	h.DB.GORM.Find(&jobs)
	return c.JSON(jobs)
}

func (h *Handler) CreateJob(c *fiber.Ctx) error {
	var req struct {
		Name        string     `json:"name"`
		Commands    []string   `json:"commands"`
		CommandsRaw string     `json:"commands_raw"`
		Schedule    string     `json:"schedule"`
		RunAt       *time.Time `json:"run_at"`
		Enabled     bool       `json:"enabled"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	// Validate: must have either schedule or run_at
	if req.Schedule == "" && req.RunAt == nil {
		return c.Status(400).JSON(fiber.Map{"error": "Must provide either schedule or run_at"})
	}

	// Validate run_at is in the future
	if req.RunAt != nil && req.RunAt.Before(time.Now()) {
		return c.Status(400).JSON(fiber.Map{"error": "run_at must be in the future"})
	}

	job := models.Job{
		Name:      req.Name,
		Schedule:  req.Schedule,
		RunAt:     req.RunAt,
		Enabled:   req.Enabled,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Handle commands from either array or raw string
	if len(req.Commands) > 0 {
		job.Commands = req.Commands
	} else if req.CommandsRaw != "" {
		job.CommandsRaw = req.CommandsRaw
		job.Commands = strings.Split(req.CommandsRaw, "\n")
	}

	if err := h.DB.GORM.Create(&job).Error; err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if job.Enabled {
		if err := h.Scheduler.ScheduleJob(&job); err != nil {
			log.Printf("Failed to schedule job %d: %v", job.ID, err)
			return c.Status(500).JSON(fiber.Map{"error": "Failed to schedule job: " + err.Error()})
		}
	}

	return c.Status(201).JSON(job)
}

func (h *Handler) UpdateJob(c *fiber.Ctx) error {
	id := c.Params("id")
	var job models.Job
	if err := h.DB.GORM.First(&job, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Job not found"})
	}

	var req struct {
		Enabled *bool `json:"enabled"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	if req.Enabled != nil {
		job.Enabled = *req.Enabled
		job.UpdatedAt = time.Now()
		h.DB.GORM.Save(&job)

		if job.Enabled {
			_ = h.Scheduler.ScheduleJob(&job)
		} else {
			h.Scheduler.Remove(int64(job.ID))
		}
	}

	return c.JSON(job)
}

func (h *Handler) DeleteJob(c *fiber.Ctx) error {
	id := c.Params("id")
	var job models.Job
	if err := h.DB.GORM.First(&job, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Job not found"})
	}

	h.Scheduler.Remove(int64(job.ID))
	h.DB.GORM.Delete(&job)
	return c.JSON(fiber.Map{"message": "Job deleted"})
}

func (h *Handler) RunJobNow(c *fiber.Ctx) error {
	id := c.Params("id")
	var job models.Job
	if err := h.DB.GORM.First(&job, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Job not found"})
	}
	exec, err := h.Scheduler.RunJobNow(&job)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(exec)
}

// ---- USERS ----
func (h *Handler) ListUsers(c *fiber.Ctx) error {
	var users []models.User
	h.DB.GORM.Find(&users)
	return c.JSON(users)
}

// ---- EXECUTIONS ----
func (h *Handler) ListExecutions(c *fiber.Ctx) error {
	var executions []models.Execution
	h.DB.GORM.Order("created_at desc").Limit(100).Find(&executions)
	return c.JSON(executions)
}
