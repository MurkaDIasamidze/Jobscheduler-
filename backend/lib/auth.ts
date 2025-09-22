import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

export interface JwtUser {
  userId: string;
  role: "user" | "admin";
}

export function verifyToken(auth?: string): JwtUser {
  if (!auth) throw new Error("Missing token");
  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token) throw new Error("Invalid token format");

  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded !== "object" || !("userId" in decoded)) {
    throw new Error("Invalid token payload");
  }
  return decoded as JwtUser;
}
