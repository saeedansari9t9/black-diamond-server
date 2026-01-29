import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listCustomers, createCustomer, getCustomerHistory, getLedger, addPayment, updateCustomer, deleteCustomer } from "../controllers/customers.controller.js";
const router = Router();

router.use(requireAuth);

router.get("/", listCustomers);
router.post("/", createCustomer);
router.get("/:id/history", getCustomerHistory);
router.get("/:id/ledger", getLedger);
router.post("/:id/payment", addPayment);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;
