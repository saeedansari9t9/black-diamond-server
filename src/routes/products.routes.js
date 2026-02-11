import { Router } from "express";
import { createProduct, listProducts, updateProduct, deleteProduct, bulkUpdateProducts } from "../controllers/products.controller.js";

const router = Router();

router.get("/", listProducts);
router.post("/", createProduct);
router.put("/bulk", bulkUpdateProducts);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
