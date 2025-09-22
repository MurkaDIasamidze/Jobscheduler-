import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ScheduleTime {
  hour: number;
  minute: number;
}

interface Schedule {
  years?: number[];
  months?: number[];
  weekdays?: number[];
  times?: ScheduleTime[];
}

function matchesSchedule(schedule: Schedule | null, now: Date): boolean {
  if (!schedule) return false;
  const { years, months, weekdays, times } = schedule;
  if (years && !years.includes(now.getFullYear())) return false;
  if (months && !months.includes(now.getMonth() + 1)) return false;
  if (weekdays && !weekdays.includes(now.getDay())) return false;
  if (times && times.length > 0) {
    return times.some(t => t.hour === now.getHours() && t.minute === now.getMinutes());
  }
  return true;
}

async function checkAndRun(): Promise<void> {
  const now = new Date();
  now.setSeconds(0, 0);

  const jobs = await prisma.job.findMany({ where: { enabled: true } });

  for (const job of jobs) {
    try {
      const schedule: Schedule = job.schedule as any;
      if (matchesSchedule(schedule, now)) {
        const last = await prisma.execution.findFirst({
          where: { jobId: job.id },
          orderBy: { ranAt: 'desc' },
        });

        if (last && Math.abs(new Date(last.ranAt).getTime() - now.getTime()) < 60 * 1000) {
          continue;
        }

        const output = `Simulated run of: ${job.command} at ${now.toISOString()}`;
        const exec = await prisma.execution.create({
          data: { jobId: job.id, ranAt: now, success: true, output },
        });

        console.log('Executed job', job.id, job.name, exec.id);
      }
    } catch (e) {
      console.error('Error checking job', job.id, e);
    }
  }
}

async function loop() {
  console.log('Scheduler started - checking every 30 seconds');
  await prisma.$connect();
  setInterval(checkAndRun, 30 * 1000);
}

loop().catch(e => {
  console.error(e);
  process.exit(1);
});
