import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { apiHandler } from "../../../lib/apiHandler";

export const GET = apiHandler(async () => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}, { auth: true, adminOnly: true });

export const PUT = apiHandler(async (req: NextRequest) => {
  const { id, role } = await req.json();
  if (!id || !["user", "admin"].includes(role)) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const updated = await prisma.user.update({ where: { id }, data: { role }, select: { id: true, email: true, name: true, role: true } });
  return NextResponse.json(updated);
}, { auth: true, adminOnly: true });
