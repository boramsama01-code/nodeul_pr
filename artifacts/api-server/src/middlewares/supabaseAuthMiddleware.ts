import type { RequestHandler } from "express";
import { supabaseAdmin } from "../lib/supabase";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

export function supabaseAuthMiddleware(): RequestHandler {
  return async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data.user) {
        req.userId = data.user.id;
        req.userEmail = data.user.email ?? "";
      }
    }
    next();
  };
}

export function getAuth(req: Express.Request): { userId: string | undefined } {
  return { userId: req.userId };
}
