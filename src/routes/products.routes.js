import { Router } from "express";
import { createProduct, listProducts, updateProduct, deleteProduct } from "../controllers/products.controller.js";

const router = Router();

router.get("/", listProducts);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
