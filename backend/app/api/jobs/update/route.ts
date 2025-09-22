import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { apiHandler } from "../../../../lib/apiHandler";
import { toDbSchedule, validateSchedule } from "../../../../lib/schedule";
import { JwtUser } from "../../../../lib/auth";

export const PUT = apiHandler(async (req: NextRequest, user?: JwtUser) => {
  const { id, name, command, schedule, enabled } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing job id" }, { status: 400 });

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (job.userId !== user!.userId && user!.role !== "admin") return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const update: any = {};
  if (name) update.name = name.trim();
  if (command) update.command = command.trim();
  if (schedule) {
    const v = validateSchedule(schedule);
    if (!v.valid) return NextResponse.json({ error: v.error }, { status: 400 });
    update.schedule = toDbSchedule(schedule);
  }
  if (enabled !== undefined) update.enabled = Boolean(enabled);

  const updated = await prisma.job.update({ where: { id }, data: update });
  return NextResponse.json(updated);
}, { auth: true });
