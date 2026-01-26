import Sale from "../models/Sale.js";
import StockLedger from "../models/StockLedger.js";
import Product from "../models/Product.js";
import { rangeFromKey, startOfDay, endOfDay } from "../utils/dates.js";

// helper: build date filter
const buildDateFilter = (from, to) => {
  const f = from ? startOfDay(new Date(from)) : null;
  const t = to ? endOfDay(new Date(to)) : null;

  const createdAt = {};
  if (f) createdAt.$gte = f;
  if (t) createdAt.$lte = t;

  return Object.keys(createdAt).length ? { createdAt } : {};
};

// ✅ Sales Summary (today/week/month/lastMonth OR custom)
export const salesSummary = async (req, res) => {
  const { range, from, to } = req.query;

  let dateFilter = {};
  if (range) {
    const r = rangeFromKey(range);
    if (!r) return res.status(400).json({ ok: false, message: "Invalid range" });
    dateFilter = { createdAt: { $gte: r.from, $lte: r.to } };
  } else {
    dateFilter = buildDateFilter(from, to);
  }

  const summary = await Sale.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        totalSales: { $sum: "$grandTotal" },
        totalDiscount: { $sum: "$discount" },
        totalDue: { $sum: "$dueAmount" },
        totalPaid: { $sum: "$paidAmount" },
      },
    },
  ]);

  const row = summary[0] || {
    orders: 0,
    totalSales: 0,
    totalDiscount: 0,
    totalDue: 0,
    totalPaid: 0,
  };

  res.json({ ok: true, data: row });
};

// ✅ Sales Trend (daily totals)
export const salesTrendDaily = async (req, res) => {
  const { from, to, days = 30 } = req.query;

  let dateFilter = {};
  if (from || to) dateFilter = buildDateFilter(from, to);
  else {
    const end = endOfDay(new Date());
    const start = startOfDay(new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000));
    dateFilter = { createdAt: { $gte: start, $lte: end } };
  }

  const data = await Sale.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        totalSales: { $sum: "$grandTotal" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ ok: true, data });
};

// ✅ Top Products (by qty sold) using StockLedger sale_out
export const topProducts = async (req, res) => {
  const { range, from, to, limit = 10 } = req.query;

  let dateFilter = {};
  if (range) {
    const r = rangeFromKey(range);
    if (r) dateFilter = { createdAt: { $gte: r.from, $lte: r.to } };
  } else {
    dateFilter = buildDateFilter(from, to);
  }

  const data = await StockLedger.aggregate([
    { $match: { ...dateFilter, type: "sale_out" } },
    {
      $group: {
        _id: "$productId",
        qtySold: { $sum: { $abs: "$qtyChange" } },
      },
    },
    { $sort: { qtySold: -1 } },
    { $limit: Number(limit) },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $lookup: {
        from: "materials",
        localField: "product.materialId",
        foreignField: "_id",
        as: "material",
      },
    },
    { $unwind: "$material" },
    {
      $project: {
        _id: 0,
        productId: "$product._id",
        sku: "$product.sku",
        material: "$material.name",
        qualityType: "$product.qualityType",
        qtySold: 1,
      },
    },
  ]);

  res.json({ ok: true, data });
};

// ✅ Top Customers (by purchase amount)
export const topCustomers = async (req, res) => {
  const { range, from, to, limit = 10 } = req.query;

  let dateFilter = {};
  if (range) {
    const r = rangeFromKey(range);
    if (r) dateFilter = { createdAt: { $gte: r.from, $lte: r.to } };
  } else {
    dateFilter = buildDateFilter(from, to);
  }

  const data = await Sale.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: "$customerId",
        name: { $first: "$customerName" }, // fallback if customerId is null or just to grab a name
        totalAmount: { $sum: "$grandTotal" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { totalAmount: -1 } },
    { $limit: Number(limit) },
    {
      $lookup: {
        from: "customers",
        localField: "_id",
        foreignField: "_id",
        as: "customerInfo"
      }
    },
    // We keep optional chaining logic in frontend, here just pass what we have. 
    // If specific customer names are needed from the Customer collection (if name in Sale is stale), we can use customerInfo.
    // Sale model has customerName which is a snapshot. Using that is usually faster/easier for simple lists unless name changed. 
    // Let's rely on Sale.customerName for now as it makes it simpler, but if we want strict reference we use lookup.
    // The previous design for Sale snapshot supports "Walk-in" which has no ID.
    {
      $project: {
        _id: 1, // customerId
        name: { $ifNull: [{ $arrayElemAt: ["$customerInfo.name", 0] }, "$name"] },
        totalAmount: 1,
        orders: 1
      }
    }
  ]);

  res.json({ ok: true, data });
};

// ✅ Slow Products (no sale in last X days OR very low sale)
export const slowProducts = async (req, res) => {
  const { days = 30, limit = 30 } = req.query;

  const end = endOfDay(new Date());
  const start = startOfDay(new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000));

  // find products that sold qty in last X days
  const sold = await StockLedger.aggregate([
    { $match: { type: "sale_out", createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: "$productId", qtySold: { $sum: { $abs: "$qtyChange" } } } },
  ]);

  const soldMap = new Map(sold.map((x) => [String(x._id), x.qtySold]));

  // list products + attach qtySold (0 if not found)
  const products = await Product.find()
    .populate("materialId", "name")
    .limit(5000);

  const result = products
    .map((p) => ({
      productId: p._id,
      sku: p.sku,
      material: p.materialId?.name,
      qualityType: p.qualityType,
      qtySold: soldMap.get(String(p._id)) || 0,
    }))
    .sort((a, b) => a.qtySold - b.qtySold)
    .slice(0, Number(limit));

  res.json({ ok: true, data: result, meta: { days: Number(days) } });
};
