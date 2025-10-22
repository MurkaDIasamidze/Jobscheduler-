package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string
	Workers     int
}

func Load() *Config {
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL missing")
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Fatal("JWT_SECRET missing")
	}

	workers := 5
	if w := os.Getenv("WORKERS"); w != "" {
		if parsed, err := strconv.Atoi(w); err == nil && parsed > 0 {
			workers = parsed
		}
	}

	return &Config{
		Port:        port,
		DatabaseURL: dbURL,
		JWTSecret:   secret,
		Workers:     workers,
	}
}
