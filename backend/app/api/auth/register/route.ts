import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcrypt";
import { apiHandler } from "../../../../lib/apiHandler";

export const POST = apiHandler(async (req: NextRequest) => {
  const { email, password, name } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "email and password required" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) return NextResponse.json({ error: "user already exists" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email: email.toLowerCase().trim(), password: hashed, name: name || null, role: "user" },
  });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
});
