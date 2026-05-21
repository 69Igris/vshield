import { Router } from "express";
import {
  analytics,
  bulkCreate,
  create,
  getOne,
  list,
  remove,
  stats,
  update,
} from "../controllers/candidate.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// All candidate routes require authentication
router.use(authMiddleware);

router.get("/stats", stats); // must come before /:id so "stats" isn't treated as an id
router.get("/analytics", analytics);
router.post("/bulk", bulkCreate);
router.post("/", create);
router.get("/", list);
router.get("/:id", getOne);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
