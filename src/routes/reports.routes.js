import { Router } from "express";
import { salesSummary, salesTrendDaily, topProducts, slowProducts } from "../controllers/reports.controller.js";

const router = Router();

// summary
// /api/reports/sales-summary?range=today|week|month|lastMonth
// OR /api/reports/sales-summary?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/sales-summary", salesSummary);

// trend
// /api/reports/sales-trend-daily?days=30
// OR /api/reports/sales-trend-daily?from=&to=
router.get("/sales-trend-daily", salesTrendDaily);

// top products
// /api/reports/top-products?from=&to=&limit=10
router.get("/top-products", topProducts);

// slow products (last X days)
router.get("/slow-products", slowProducts);

export default router;
