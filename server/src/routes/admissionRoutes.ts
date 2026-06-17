import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadPdf } from "../middleware/upload";
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

router.post("/upload", uploadPdf, asyncHandler(uploadAdmission));
router.get("/extract/:jobId/events", streamAdmissionEvents);

router.get("/", asyncHandler(listAdmissions));
router.get("/:id", asyncHandler(getAdmission));
router.patch("/:id", asyncHandler(updateAdmission));
router.post("/:id/confirm", asyncHandler(confirmAdmission));
router.post("/:id/reject", asyncHandler(rejectAdmission));
router.delete("/:id", asyncHandler(deleteAdmission));

export default router;
