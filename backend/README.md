# Backend - Next.js API + Prisma

Features:
- Next.js API routes for auth, jobs, executions
- Prisma + PostgreSQL schema
- JWT authentication
- Separate `scheduler.js` that runs periodically to evaluate job schedules and record executions

Important:
1. Copy `.env.example` to `.env` and set DATABASE_URL and JWT_SECRET.
2. Install dependencies: `pnpm install` (or `npm install`)
3. Generate Prisma client: `pnpm prisma generate`
4. Run migrations: `pnpm prisma migrate dev --name init`
5. Seed admin user: `pnpm run seed`
6. Start Next dev server: `pnpm dev` (runs on port 3001)
7. Start scheduler in a separate terminal: `pnpm scheduler` (runs as a separate Node process)

The scheduler intentionally **simulates** command execution and stores a record. To run real commands, modify `scheduler.js` to use `child_process.exec` safely.

Converted API routes added under `app/api/*` using Next.js App Router route handlers.
