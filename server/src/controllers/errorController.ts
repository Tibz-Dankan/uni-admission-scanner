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

  res.status(statusCode).json({
    status,
    message: err.message || "Something went wrong",
  });
}
