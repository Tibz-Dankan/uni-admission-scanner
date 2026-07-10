import type { Request, Response } from "express";
import * as authService from "../services/authService";
import { signinSchema, signupSchema } from "../types/auth";
import { AppError } from "../utils/error";

export async function signup(req: Request, res: Response): Promise<void> {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const result = await authService.signup(parsed.data);
  res.status(201).json({ status: "success", data: result });
}

export async function signin(req: Request, res: Response): Promise<void> {
  const parsed = signinSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const result = await authService.signin(parsed.data);
  res.status(200).json({ status: "success", data: result });
}
