import { Router } from "express";
import { createPurchase, listPurchases, getPurchaseById } from "../controllers/purchases.controller.js";

const router = Router();

router.post("/", createPurchase);
router.get("/", listPurchases);
router.get("/:id", getPurchaseById);

export default router;
