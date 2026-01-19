import { Router } from "express";
import { createMaterial, listMaterials, updateMaterial, deleteMaterial } from "../controllers/materials.controller.js";

const router = Router();

router.get("/", listMaterials);
router.post("/", createMaterial);
router.put("/:id", updateMaterial);
router.delete("/:id", deleteMaterial);

export default router;
