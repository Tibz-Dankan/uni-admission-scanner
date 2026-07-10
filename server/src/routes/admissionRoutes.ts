import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadPdf } from "../middleware/upload";
import { requireAuth } from "../middleware/auth";
import {
  confirmAdmission,
  deleteAdmission,
  getAdmission,
  listAdmissions,
  rejectAdmission,
  streamAdmissionEvents,
  updateAdmission,
  uploadAdmission,
} from "../controllers/admissionController";

const router = Router();

router.post("/upload", requireAuth, uploadPdf, asyncHandler(uploadAdmission));
router.get("/extract/:jobId/events", requireAuth, streamAdmissionEvents);

router.get("/", requireAuth, asyncHandler(listAdmissions));
router.get("/:id", requireAuth, asyncHandler(getAdmission));
router.patch("/:id", requireAuth, asyncHandler(updateAdmission));
router.post("/:id/confirm", requireAuth, asyncHandler(confirmAdmission));
router.post("/:id/reject", requireAuth, asyncHandler(rejectAdmission));
router.delete("/:id", requireAuth, asyncHandler(deleteAdmission));

export default router;
