import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { apiHandler } from "../../../../lib/apiHandler";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

export const POST = apiHandler(async (req: NextRequest) => {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "email and password required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
  return NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});
