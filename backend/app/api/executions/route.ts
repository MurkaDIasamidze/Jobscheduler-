// api/executions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { apiHandler } from "../../../lib/apiHandler";
import { JwtUser } from "../../../lib/auth";

export const GET = apiHandler(
  async (req: NextRequest, user?: JwtUser) => {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20");

    const executions = await prisma.execution.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ createdAt: "desc" }], // Changed from startedAt to createdAt
      include: { job: true },
    });

    return NextResponse.json(executions);
  },
  { auth: true }
);