import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { signin, signup } from "../controllers/authController";

const router = Router();

router.post("/signup", asyncHandler(signup));
router.post("/signin", asyncHandler(signin));

export default router;
