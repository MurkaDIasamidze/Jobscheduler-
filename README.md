Job Scheduler
A full-featured Job Scheduler built with Go, Fiber, React, TypeScript, Tailwind CSS, PostgreSQL, and GORM. Supports flexible cron-based scheduling, execution history, real-time updates, and secure authentication.
Features
Frontend

User authentication (Register/Login/Logout)
Health check on startup - ensures backend and database are connected before use
Job management:

Create, enable/disable, delete jobs
User-friendly schedule selection (every minute, hourly, daily, weekly, etc.)
Multiple commands per job (executed in parallel)
Run jobs immediately with "Run Now" button


Real-time job and execution updates (auto-refresh every 10 seconds)
Execution history display with:

Success/failure status
Command output logs
Timestamps


Comprehensive error handling and console logging for debugging
Clean, responsive UI with dark theme

Backend

Go Fiber REST API with JWT authentication
Robfig cron for flexible scheduling (supports cron expressions with seconds)
Job CRUD operations:

Create jobs with multiple commands
Update job status (enable/disable)
Delete jobs
Run jobs on-demand


Concurrent command execution - runs multiple commands in parallel per job
GORM hooks for automatic command serialization/deserialization
Cross-platform command execution (Windows/Linux/Mac)
Health check endpoint for monitoring database connectivity
Execution logging to PostgreSQL with detailed output
Scheduler automatically:

Loads enabled jobs on startup
Supports both recurring (cron) and one-time (RunAt) schedules
Records last run times
Logs all execution results



Database

PostgreSQL + GORM ORM
Tables:

users – user data, email, password hash, and roles
jobs – scheduled jobs with commands, cron schedules, and enabled status
executions – complete logs of executed jobs with output, timestamps, and success status
