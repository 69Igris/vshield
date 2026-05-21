import { Router } from "express";
import { start } from "../controllers/verification.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

// POST /api/verifications/:id/start  — kick off Aadhaar + PAN checks
router.post("/:id/start", start);

export default router;
