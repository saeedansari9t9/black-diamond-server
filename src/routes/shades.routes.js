import { Router } from "express";
import { createShade, listShades } from "../controllers/shades.controller.js";

const router = Router();

router.get("/", listShades);
router.post("/", createShade);

export default router;
