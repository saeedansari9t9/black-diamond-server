import { Router } from "express";
import { login, register, me } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";

const router = Router();

// Admin-only user creation (recommended)
router.post("/register", requireAuth, requireRole("admin"), register);

router.post("/login", login);
router.get("/me", requireAuth, me);

export default router;
