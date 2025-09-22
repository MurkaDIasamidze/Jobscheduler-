import { prisma } from "../lib/prisma";
import { exec } from "child_process";
import { Prisma } from "@prisma/client";

// Define types for better TypeScript support
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

/**
 * Parse schedule from JsonValue to object
 */
function parseSchedule(schedule: Prisma.JsonValue): ParsedSchedule | null {
  try {
    // If it's already an object, return it
    if (typeof schedule === 'object' && schedule !== null) {
      return schedule as ParsedSchedule;
    }
    // If it's a string, try to parse it
    if (typeof schedule === 'string') {
      return JSON.parse(schedule) as ParsedSchedule;
    }
    // For other types, return null
    return null;
  } catch (error) {
    console.error('Failed to parse schedule:', schedule, error);
    return null;
  }
}

/**
 * Проверяет, нужно ли выполнить задачу сейчас
 */
function shouldRun(schedule: ParsedSchedule | null, date: Date = new Date()): boolean {
  if (!schedule) return false;

  const years = schedule.years ?? [date.getFullYear()];
  const months = schedule.months ?? [date.getMonth() + 1]; // JS months 0-11
  const weekdays = schedule.weekdays ?? [date.getDay()];
  const daysOfMonth = schedule.daysOfMonth ?? [date.getDate()];
  const times = schedule.times ?? [
    { hour: date.getHours(), minute: date.getMinutes() },
  ];

  if (!years.includes(date.getFullYear())) return false;
  if (!months.includes(date.getMonth() + 1)) return false;
  if (!weekdays.includes(date.getDay())) return false;
  if (!daysOfMonth.includes(date.getDate())) return false;

  return times.some(
    (t: ScheduleTime) => t.hour === date.getHours() && t.minute === date.getMinutes()
  );
}

/**
 * Выполняет команду и логирует результат
 */
async function runJob(job: JobWithSchedule) {
  return new Promise<void>((resolve) => {
    const start = new Date();
    exec(job.command, async (error, stdout, stderr) => {
      const end = new Date();
      console.log(`Job "${job.name}" executed. Success: ${!error}`);

      try {
        await prisma.execution.create({
          data: {
            jobId: job.id,
            success: !error,
            output: stdout || stderr || null,
            createdAt: start,
            updatedAt: end,
          },
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
      }

      resolve();
    });
  });
}

/**
 * Основной цикл worker
 */
async function workerLoop() {
  try {
    console.log("Worker running...");
    const jobs = await prisma.job.findMany({ where: { enabled: true } });

    const now = new Date();
    for (const job of jobs) {
      const schedule = parseSchedule(job.schedule);
      if (shouldRun(schedule, now)) {
        console.log(`Running job: ${job.name}`);
        await runJob(job);
      }
    }
  } catch (error) {
    console.error('Worker loop error:', error);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await prisma.$disconnect();
  process.exit(0);
});

// Запуск каждые 60 секунд
const intervalId = setInterval(workerLoop, 60 * 1000);

// Запуск один раз при старте
workerLoop().catch(console.error);

console.log('Job scheduler worker started. Press Ctrl+C to stop.');