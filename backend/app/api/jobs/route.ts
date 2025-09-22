// app/api/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { apiHandler } from "../../../lib/apiHandler";
import { parseSchedule, toDbSchedule, validateSchedule } from "../../../lib/schedule";
import { JwtUser } from "../../../lib/auth";
import { runJob, stopJob } from "../../../scripts/start-worker";

export const POST = apiHandler(async (req: NextRequest, user?: JwtUser) => {
  const { name, command, schedule } = await req.json();
  if (!name || !command || !schedule)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const validation = validateSchedule(schedule);
  if (!validation.valid)
    return NextResponse.json({ error: validation.error }, { status: 400 });

  const job = await prisma.job.create({
    data: { name, command, schedule: toDbSchedule(schedule), userId: user!.userId, enabled: true },
  });

  // Run immediately
  await runJob(job);

  return NextResponse.json({ ...job, schedule });
}, { auth: true });

export const GET = apiHandler(async (req: NextRequest, user?: JwtUser) => {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 20);

  const where = user!.role === "admin" ? {} : { userId: user!.userId };
  const jobs = await prisma.job.findMany({
    where,
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(jobs.map(j => ({ ...j, schedule: parseSchedule(j.schedule) })));
}, { auth: true });

export const PUT = apiHandler(async (req: NextRequest, user?: JwtUser) => {
  const { id, enabled, name, command, schedule } = await req.json();

  const data: any = {};
  if (enabled !== undefined) data.enabled = enabled;
  if (name) data.name = name;
  if (command) data.command = command;
  if (schedule) {
    const validation = validateSchedule(schedule);
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });
    data.schedule = toDbSchedule(schedule);
  }

  const job = await prisma.job.update({ where: { id }, data });

  // Immediate run or stop
  if (enabled === true) await runJob(job);
  if (enabled === false) await stopJob(job);

  return NextResponse.json({ ...job, schedule: parseSchedule(job.schedule) });
}, { auth: true });

export const DELETE = apiHandler(async (req: NextRequest, user?: JwtUser) => {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing job id" }, { status: 400 });

  const job = await prisma.job.delete({ where: { id } });
  await stopJob(job); // stop if running

  return NextResponse.json({ success: true });
}, { auth: true });
