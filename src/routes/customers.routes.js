import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listCustomers, createCustomer, getCustomerHistory } from "../controllers/customers.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", listCustomers);
router.post("/", createCustomer);
router.get("/:id/history", getCustomerHistory);

export default router;
