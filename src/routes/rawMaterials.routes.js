import { Router } from "express";
import { createRawMaterial, listRawMaterials, updateRawMaterial, deleteRawMaterial } from "../controllers/rawMaterials.controller.js";

const router = Router();

router.post("/", createRawMaterial);
router.get("/", listRawMaterials);
router.put("/:id", updateRawMaterial);
router.delete("/:id", deleteRawMaterial);

export default router;
