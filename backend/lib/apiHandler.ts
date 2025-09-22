import { NextRequest, NextResponse } from "next/server";
import { withCors, handleOptions } from "./cors";
import { verifyToken, JwtUser } from "./auth";

type HandlerFn = (req: NextRequest, user?: JwtUser) => Promise<NextResponse>;

interface Options {
  auth?: boolean;       // whether to require JWT
  adminOnly?: boolean;  // require admin role
}

export function apiHandler(fn: HandlerFn, opts: Options = { auth: false }) {
  return async (req: NextRequest) => {
    if (req.method === "OPTIONS") return handleOptions();

    try {
      let user: JwtUser | undefined;

      if (opts.auth) {
        user = verifyToken(req.headers.get("authorization") || undefined);
        if (opts.adminOnly && user.role !== "admin") {
          return withCors(NextResponse.json({ error: "Admin access required" }, { status: 403 }));
        }
      }

      const res = await fn(req, user);
      return withCors(res);
    } catch (e: any) {
      return withCors(NextResponse.json({ error: e.message || "Internal error" }, { status: 500 }));
    }
  };
}
