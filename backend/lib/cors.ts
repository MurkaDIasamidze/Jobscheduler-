import { NextResponse } from "next/server";

const ALLOWED_ORIGIN = process.env.FRONTEND_URL || "http://localhost:3000";

export const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Allow-Credentials": "true",
};

export function withCors(res: NextResponse) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export function handleOptions() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
