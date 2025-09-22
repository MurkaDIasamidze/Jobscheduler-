// backend/worker.ts
import { prisma } from "../lib/prisma";
import { exec, ChildProcess } from "child_process";
import { Prisma } from "@prisma/client";

interface ScheduleTime {
  hour: number;
  minute: number;
}

interface ParsedSchedule {
  years?: number[];
  months?: number[];
  weekdays?: number[];
  daysOfMonth?: number[];
  times?: ScheduleTime[];
}

type JobWithSchedule = {
  id: string;
  name: string;
  command: string;
  schedule: Prisma.JsonValue;
  enabled: boolean;
};

// Track currently running jobs
const runningJobs = new Map<string, ChildProcess>();
const MAX_CONCURRENT_JOBS = 5;
let currentRunning = 0;

export function parseSchedule(schedule: Prisma.JsonValue): ParsedSchedule | null {
  try {
    if (typeof schedule === "object" && schedule !== null) return schedule as ParsedSchedule;
    if (typeof schedule === "string") return JSON.parse(schedule) as ParsedSchedule;
    return null;
  } catch (error) {
    console.error("Failed to parse schedule:", schedule, error);
    return null;
  }
}

export function shouldRun(schedule: ParsedSchedule | null, date: Date = new Date()): boolean {
  if (!schedule) return false;
  const years = schedule.years ?? [date.getFullYear()];
  const months = schedule.months ?? [date.getMonth() + 1];
  const weekdays = schedule.weekdays ?? [date.getDay()];
  const daysOfMonth = schedule.daysOfMonth ?? [date.getDate()];
  const times = schedule.times ?? [{ hour: date.getHours(), minute: date.getMinutes() }];

  if (!years.includes(date.getFullYear())) return false;
  if (!months.includes(date.getMonth() + 1)) return false;
  if (!weekdays.includes(date.getDay())) return false;
  if (!daysOfMonth.includes(date.getDate())) return false;

  return times.some((t: ScheduleTime) => t.hour === date.getHours() && t.minute === date.getMinutes());
}

export async function runJob(job: JobWithSchedule) {
  if (runningJobs.has(job.id)) return;
  if (currentRunning >= MAX_CONCURRENT_JOBS) return;

  currentRunning++;
  console.log(`Running job: ${job.name}`);
  const start = new Date();

  const child = exec(job.command, async (err, stdout, stderr) => {
    const end = new Date();
    try {
      await prisma.execution.create({
        data: {
          jobId: job.id,
          success: !err,
          output: stdout || stderr || null,
          createdAt: start,
          updatedAt: end,
        },
      });
    } catch (dbErr) {
      console.error("DB error logging execution:", dbErr);
    }
    runningJobs.delete(job.id);
    currentRunning--;
  });

  runningJobs.set(job.id, child);
}

export async function stopJob(job: JobWithSchedule) {
  const child = runningJobs.get(job.id);
  if (child) {
    child.kill("SIGTERM");
    runningJobs.delete(job.id);
    currentRunning--;
    console.log(`Stopped job: ${job.name}`);
  }
}

// Worker loop every 60 seconds
async function workerLoop() {
  try {
    const jobs = await prisma.job.findMany({ where: { enabled: true } });
    const now = new Date();
    for (const job of jobs) {
      const schedule = parseSchedule(job.schedule);
      if (shouldRun(schedule, now)) await runJob(job);
    }
  } catch (err) {
    console.error("Worker loop error:", err);
  }
}

setInterval(workerLoop, 60 * 1000);
workerLoop().catch(console.error);

process.on("SIGINT", async () => {
  console.log("Shutting down worker...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down worker...");
  await prisma.$disconnect();
  process.exit(0);
});
