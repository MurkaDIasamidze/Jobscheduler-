import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { apiHandler } from "../../../../lib/apiHandler";
import { parseSchedule } from "../../../../lib/schedule";
import { JwtUser } from "../../../../lib/auth";

export const GET = apiHandler(async (req: NextRequest, user?: JwtUser) => {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20");
  const userIdQuery = url.searchParams.get("userId");

  // Only admins can see other users' jobs
  const where = userIdQuery && user!.role === "admin"
    ? { userId: userIdQuery }
    : { userId: user!.userId };

  const jobs = await prisma.job.findMany({
    where,
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  // Parse schedule into object if JSON, keep string if cron
  const jobsWithParsedSchedules = jobs.map(job => ({
    ...job,
    schedule: parseSchedule(job.schedule),
  }));

  return NextResponse.json(jobsWithParsedSchedules);
}, { auth: true });
