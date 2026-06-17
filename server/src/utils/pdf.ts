import { PDFDocument } from "pdf-lib";
import { AppError } from "./error";

export interface LimitedPdf {
  buffer: Buffer;
  pageCount: number;
  totalPageCount: number;
  truncated: boolean;
}

async function loadPdf(buffer: Buffer): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(buffer);
  } catch {
    throw new AppError("Uploaded file is not a valid PDF document", 400);
  }
}

export async function getPdfPageCount(buffer: Buffer): Promise<number> {
  const pdf = await loadPdf(buffer);
  return pdf.getPageCount();
}

/**
 * Caps a PDF to its first `maxPages` pages so 1-page and multi-page uploads
 * go through the same extraction path. Returns the original buffer
 * untouched when it's already within the limit.
 */
export async function limitPdfPages(
  buffer: Buffer,
  maxPages: number
): Promise<LimitedPdf> {
  const source = await loadPdf(buffer);
  const totalPageCount = source.getPageCount();

  if (totalPageCount === 0) {
    throw new AppError("Uploaded PDF has no pages", 400);
  }

  if (totalPageCount <= maxPages) {
    return { buffer, pageCount: totalPageCount, totalPageCount, truncated: false };
  }

  const limited = await PDFDocument.create();
  const pageIndices = Array.from({ length: maxPages }, (_, i) => i);
  const pages = await limited.copyPages(source, pageIndices);
  pages.forEach((page) => limited.addPage(page));

  const limitedBytes = await limited.save();
  return {
    buffer: Buffer.from(limitedBytes),
    pageCount: maxPages,
    totalPageCount,
    truncated: true,
  };
}
