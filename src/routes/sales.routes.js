import { Router } from "express";
import { createSale, listSales ,getSaleById} from "../controllers/sales.controller.js";

const router = Router();

router.get("/", listSales);
router.post("/", createSale);
router.get("/:id", getSaleById);

export default router;
