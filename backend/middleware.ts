import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { corsHeaders } from "./lib/cors";

export function middleware(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
  }

  const res = NextResponse.next();
  Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export const config = { matcher: ["/api/:path*"] };
