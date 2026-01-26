import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { listUsers, createUser, updateUserStatus, updateUser, deleteUser } from "../controllers/users.controller.js";

const router = Router();

// Admin only
router.use(requireAuth, requireRole("admin"));

router.get("/", listUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.patch("/:id/status", updateUserStatus);

export default router;
