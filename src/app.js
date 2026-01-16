import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import materialsRoutes from "./routes/materials.routes.js";
import productsRoutes from "./routes/products.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import salesRoutes from "./routes/sales.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import passwordRoutes from "./routes/password.routes.js";
import customersRoutes from "./routes/customers.routes.js";

const app = express();

app.use(helmet());
app.use(morgan("dev"));

// ✅ Body parsers (MUST be before routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "API is running" });
});

// ✅ Routes
app.use("/api/materials", materialsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/customers", customersRoutes);

export default app;
