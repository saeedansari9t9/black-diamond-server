import express from "express";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, getLedger, paySupplier } from "../controllers/suppliers.controller.js";

const router = express.Router();

router.get("/", getSuppliers);
router.post("/", createSupplier);
router.get("/:id/ledger", getLedger);
router.post("/:id/pay", paySupplier);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

export default router;
