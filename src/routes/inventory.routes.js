import { Router } from "express";
import { addStockEntry, getCurrentStock } from "../controllers/inventory.controller.js";

const router = Router();

router.get("/stock", getCurrentStock);
router.post("/ledger", addStockEntry);

export default router;
