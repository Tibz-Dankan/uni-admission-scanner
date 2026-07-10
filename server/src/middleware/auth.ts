import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/error";
import type { JwtPayload } from "../types/auth";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;

  if (!bearerToken) {
    next(new AppError("You are not logged in. Please log in to gain access.", 401));
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    next(new AppError("Server auth configuration is missing", 500));
    return;
  }

  try {
    const payload = jwt.verify(bearerToken, secret) as JwtPayload;
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError("Invalid or expired token. Please log in again.", 401));
  }
}
