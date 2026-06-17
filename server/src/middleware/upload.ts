import multer from "multer";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/error";

const maxSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB) || 25;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== "application/pdf") {
      callback(new AppError("Only PDF files are accepted", 400));
      return;
    }
    callback(null, true);
  },
}).single("file");

export function uploadPdf(req: Request, res: Response, next: NextFunction) {
  upload(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      next(new AppError(err.message, 400));
      return;
    }
    if (err) {
      next(err);
      return;
    }
    if (!req.file) {
      next(new AppError("No file was uploaded", 400));
      return;
    }
    next();
  });
}
