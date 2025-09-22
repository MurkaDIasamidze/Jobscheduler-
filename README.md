#JobScheduler 

This repository contains:
- backend/: Next.js API + Prisma + PostgreSQL DB
- frontend/: React + Vite + TypeScript + Tailwind

That implements:
- JWT auth (login/register/profile)
- Jobs CRUD
- Execution history recording via a separate scheduler process that simulates running commands
- Wokers 
- Flexible schedule JSON object matching (years, months, weekdays, times)

Notes:
- For reliability in production, run the scheduler as a separate process (Docker service, systemd, or a worker)
- For safety, scheduler currently simulates command execution. Replace with child_process.exec if you understand the security implications.# Jobscheduler-
# Jobscheduler-
