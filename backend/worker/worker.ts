// // worker.ts
// import { prisma } from "../lib/prisma";
// import { parseSchedule } from "../lib/schedule";
// import { exec } from "child_process";

// /**
//  * Проверяет, нужно ли выполнить задачу сейчас
//  */
// function shouldRun(schedule: any, date: Date = new Date()): boolean {
//   if (!schedule) return false;

//   const years = schedule.years ?? [date.getFullYear()];
//   const months = schedule.months ?? [date.getMonth() + 1]; // JS months 0-11
//   const weekdays = schedule.weekdays ?? [date.getDay()];
//   const daysOfMonth = schedule.daysOfMonth ?? [date.getDate()];
//   const times = schedule.times ?? [
//     { hour: date.getHours(), minute: date.getMinutes() },
//   ];

//   if (!years.includes(date.getFullYear())) return false;
//   if (!months.includes(date.getMonth() + 1)) return false;
//   if (!weekdays.includes(date.getDay())) return false;
//   if (!daysOfMonth.includes(date.getDate())) return false;

//   return times.some(
//     (t: any) => t.hour === date.getHours() && t.minute === date.getMinutes()
//   );
// }

// /**
//  * Выполняет команду и логирует результат
//  */
// async function runJob(job: any) {
//   return new Promise<void>((resolve) => {
//     const start = new Date();
//     exec(job.command, async (error, stdout, stderr) => {
//       const end = new Date();
//       console.log(`Job "${job.name}" executed. Success: ${!error}`);

//       await prisma.execution.create({
//         data: {
//           jobId: job.id,
//           success: !error,
//           output: stdout || stderr,
//           createdAt: start, // Changed from startedAt to createdAt
//           updatedAt: end,   // Changed from finishedAt to updatedAt
//         },
//       });

//       resolve();
//     });
//   });
// }

// /**
//  * Основной цикл worker
//  */
// async function workerLoop() {
//   console.log("Worker running...");
//   const jobs = await prisma.job.findMany({ where: { enabled: true } });

//   const now = new Date();
//   for (const job of jobs) {
//     const schedule = parseSchedule(job.schedule);
//     if (shouldRun(schedule, now)) {
//       console.log(`Running job: ${job.name}`);
//       await runJob(job);
//     }
//   }
// }

// // Запуск каждые 60 секунд
// setInterval(workerLoop, 60 * 1000);

// // Запуск один раз при старте
// workerLoop().catch(console.error);