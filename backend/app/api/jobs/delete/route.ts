import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { apiHandler } from "../../../../lib/apiHandler";
import { JwtUser } from "../../../../lib/auth";

export const DELETE = apiHandler(async (req: NextRequest, user?: JwtUser) => {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing job id" }, { status: 400 });

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (job.userId !== user!.userId && user!.role !== "admin") return NextResponse.json({ error: "Access denied" }, { status: 403 });

  await prisma.job.delete({ where: { id } });
  return NextResponse.json({ success: true });
}, { auth: true });
