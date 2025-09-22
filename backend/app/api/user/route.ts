import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { apiHandler } from "../../../lib/apiHandler";
import { JwtUser } from "../../../lib/auth";

export const GET = apiHandler(async (_req, user?: JwtUser) => {
  const self = await prisma.user.findUnique({
    where: { id: user!.userId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!self) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(self);
}, { auth: true });
