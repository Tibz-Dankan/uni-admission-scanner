import type { Request, Response } from "express";
import type { AdmissionStatus } from "../generated/prisma/client";
import * as admissionService from "../services/admissionService";
import { sseHub } from "../utils/sseHub";
import { AppError } from "../utils/error";

const HEARTBEAT_INTERVAL_MS = 20_000;

export async function uploadAdmission(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw new AppError("No file was uploaded", 400);
  }
  const jobId = admissionService.startExtractionJob(req.file.buffer);
  res.status(202).json({ status: "success", data: { jobId } });
}

export function streamAdmissionEvents(req: Request<{ jobId: string }>, res: Response): void {
  const { jobId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: "warmup", message: "connected" })}\n\n`);

  for (const event of sseHub.getHistory(jobId)) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: "heartbeat", message: "heartbeat" })}\n\n`);
  }, HEARTBEAT_INTERVAL_MS);

  const unsubscribe = sseHub.subscribe(jobId, (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    if (event.type === "review_ready" || event.type === "failed") {
      res.end();
    }
  });

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
}

export async function listAdmissions(req: Request, res: Response): Promise<void> {
  const { status, page, pageSize, search } = req.query;
  const result = await admissionService.listAdmissions({
    status: typeof status === "string" ? (status as AdmissionStatus) : undefined,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
    search: typeof search === "string" ? search : undefined,
  });
  res.status(200).json({ status: "success", data: result });
}

export async function getAdmission(req: Request<{ id: string }>, res: Response): Promise<void> {
  const admission = await admissionService.getAdmission(req.params.id);
  res.status(200).json({ status: "success", data: admission });
}

export async function updateAdmission(req: Request<{ id: string }>, res: Response): Promise<void> {
  const admission = await admissionService.updateAdmission(req.params.id, req.body);
  res.status(200).json({ status: "success", data: admission });
}

export async function confirmAdmission(req: Request<{ id: string }>, res: Response): Promise<void> {
  const admission = await admissionService.confirmAdmission(req.params.id);
  res.status(200).json({ status: "success", data: admission });
}

export async function rejectAdmission(req: Request<{ id: string }>, res: Response): Promise<void> {
  const admission = await admissionService.rejectAdmission(req.params.id);
  res.status(200).json({ status: "success", data: admission });
}

export async function deleteAdmission(req: Request<{ id: string }>, res: Response): Promise<void> {
  await admissionService.deleteAdmission(req.params.id);
  res.status(204).end();
}
