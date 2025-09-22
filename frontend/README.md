# Frontend - React + Vite + TypeScript + Tailwind

Quickstart:
1. Install deps: `pnpm install` (or npm)
2. Start dev server: `pnpm dev` (will run on http://localhost:3000)
3. Ensure backend is running on http://localhost:3001

This is a minimal UI for logging in, creating jobs (paste schedule JSON), and listing jobs.

Admin UI: `src/pages/Admin.tsx` — visit `/` then navigate to Admin via your dev server or import into routing. It expects an admin JWT in localStorage under `token`.
