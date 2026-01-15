import { Router } from "express";
import { createMaterial, listMaterials } from "../controllers/materials.controller.js";

const router = Router();

router.get("/", listMaterials);
router.post("/", createMaterial);

export default router;
