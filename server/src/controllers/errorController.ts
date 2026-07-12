import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/error";

export default function errorController(
  err: AppError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const status = err instanceof AppError ? err.status : "error";

  console.error(err);
  if ((err as { cause?: unknown }).cause) {
    console.error("Caused by:", (err as { cause?: unknown }).cause);
  }

  res.status(statusCode).json({
    status,
    message: err.message || "Something went wrong",
  });
}
