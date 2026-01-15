import StockLedger from "../models/StockLedger.js";
import Product from "../models/Product.js";

// ✅ Add stock (purchase_add) OR adjust (+/-)
export const addStockEntry = async (req, res) => {
  const { productId, type, qtyChange, note } = req.body || {};

  if (!productId || !type || typeof qtyChange !== "number") {
    return res.status(400).json({ ok: false, message: "productId, type, qtyChange(number) required" });
  }

  const p = await Product.findById(productId);
  if (!p) return res.status(404).json({ ok: false, message: "Product not found" });

  const entry = await StockLedger.create({
    productId,
    type,
    qtyChange,
    note: note || "",
  });

  res.status(201).json({ ok: true, data: entry });
};

// ✅ Current stock (sum of ledger)
export const getCurrentStock = async (req, res) => {
  const { materialId, shadeId, q } = req.query;

  const matchProduct = {};
  if (materialId) matchProduct.materialId = materialId;
  if (shadeId) matchProduct.shadeId = shadeId;
  if (q) matchProduct.sku = { $regex: q, $options: "i" };

  const data = await Product.aggregate([
    { $match: matchProduct },
    {
      $lookup: {
        from: "stockledgers",
        localField: "_id",
        foreignField: "productId",
        as: "moves",
      },
    },
    {
      $addFields: {
        stock: { $sum: "$moves.qtyChange" },
      },
    },
    {
      $project: {
        materialId: 1,
        shadeId: 1,
        size: 1,
        qualityType: 1,
        sku: 1,
        retailPrice: 1,
        wholesalePrice: 1,
        stock: 1,
      },
    },
    { $sort: { stock: 1 } },
  ]);

  res.json({ ok: true, data });
};
