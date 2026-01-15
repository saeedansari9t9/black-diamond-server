import { Router } from "express";
import { createProduct, listProducts } from "../controllers/products.controller.js";

const router = Router();

router.get("/", listProducts);
router.post("/", createProduct);

export default router;
