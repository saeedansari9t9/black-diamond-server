import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { changeMyPassword, adminResetPassword } from "../controllers/password.controller.js";

const router = Router();

router.post("/change", requireAuth, changeMyPassword);
router.post("/reset/:id", requireAuth, requireRole("admin"), adminResetPassword);

export default router;
