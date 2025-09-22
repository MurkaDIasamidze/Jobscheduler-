import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { apiHandler } from "../../../lib/apiHandler";

export const GET = apiHandler(async () => {
  const executions = await prisma.execution.findMany({ orderBy: { ranAt: "desc" }, take: 200 });
  return NextResponse.json(executions);
}, { auth: true });
