package config

import (
    "log"
    "os"

    "github.com/joho/godotenv"
)

type Config struct {
    Port        string
    DatabaseURL string
    LogLevel    string
}

func Load() *Config {
    // load .env if present
    _ = godotenv.Load()

    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }

    dbURL := os.Getenv("DATABASE_URL")
    if dbURL == "" {
        log.Fatal("DATABASE_URL missing (set it in .env or env vars)")
    }

    lvl := os.Getenv("LOG_LEVEL")
    if lvl == "" {
        lvl = "info"
    }

    return &Config{
        Port:        port,
        DatabaseURL: dbURL,
        LogLevel:    lvl,
    }
}
