import { Router } from "express";
import { download } from "../controllers/report.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

// GET /api/reports/:id  -> downloads the PDF for the candidate
router.get("/:id", download);

export default router;
