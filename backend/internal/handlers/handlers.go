package handlers

import (
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"github.com/yourusername/jobscheduler-go/internal/db"
	"github.com/yourusername/jobscheduler-go/internal/models"
	"github.com/yourusername/jobscheduler-go/internal/scheduler"
)

type Handler struct {
	DB        *db.DB
	Scheduler *scheduler.Scheduler
	JWTSecret string
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
	var j models.Job
	if err := c.BodyParser(&j); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}
	j.CreatedAt = time.Now()
	j.UpdatedAt = time.Now()
	h.DB.GORM.Create(&j)
	if j.Enabled {
		_ = h.Scheduler.ScheduleJob(&j)
	}
	return c.Status(201).JSON(j)
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

// ---- PARALLEL MULTI-COMMAND ----
func RunMultipleCommands(commands []string) []string {
	var wg sync.WaitGroup
	outputs := make([]string, len(commands))

	for i, cmd := range commands {
		wg.Add(1)
		go func(i int, cmd string) {
			defer wg.Done()
			outputs[i] = scheduler.ExecuteCommand(cmd)
		}(i, cmd)
	}
	wg.Wait()
	return outputs
}
