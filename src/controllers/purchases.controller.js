import Purchase from "../models/Purchase.js";
import Supplier from "../models/Supplier.js";
import { makePurchaseNo } from "../utils/purchase.js";

export const createPurchase = async (req, res) => {
  const {
    supplierId,
    paymentMethod = "cash",
    paidAmount = 0,
    items,
    note = "",
  } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, message: "Items required" });
  }

  // Validate items & calculate
  let subTotal = 0;
  const normalizedItems = [];

  for (const it of items) {
    const { materialId, description, qty, unit = "kg", price, attributes } = it || {};

    if (!description && !materialId) {
      return res.status(400).json({ ok: false, message: "Material or Description required" });
    }
    if (!qty || price === undefined) {
      return res.status(400).json({ ok: false, message: "Qty and Price required" });
    }

    const lineTotal = Number(qty) * Number(price);
    subTotal += lineTotal;

    normalizedItems.push({
      materialId: materialId || null,
      description: description || "Unknown Material",
      qty: Number(qty),
      unit,
      price: Number(price),
      lineTotal,
      attributes: attributes || {},
    });
  }

  const grandTotal = subTotal;
  const paid = Number(paidAmount || 0);
  const due = Math.max(0, grandTotal - paid);

  const purchaseNo = makePurchaseNo();

  let supplierSnapshot = { name: "Walk-in", phone: "" };
  if (supplierId) {
    const s = await Supplier.findById(supplierId);
    if (s) supplierSnapshot = { name: s.name, phone: s.phone || "" };
  }

  // Create Purchase
  const purchase = await Purchase.create({
    supplierId: supplierId || null,
    supplierSnapshot,
    purchaseNo,
    items: normalizedItems,
    subTotal,
    grandTotal,
    paymentMethod,
    paidAmount: paid,
    dueAmount: due,
    note,
  });

  // NO StockLedger update here. 
  // Raw material purchase does not affect Finished Goods stock.

  res.status(201).json({ ok: true, data: purchase });
};

export const listPurchases = async (req, res) => {
  const { from, to, supplierId } = req.query;

  const filter = {};
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  if (supplierId) filter.supplierId = supplierId;

  const data = await Purchase.find(filter)
    .populate("supplierId", "name")
    .sort({ createdAt: -1 })
    .limit(200);

  res.json({ ok: true, data });
};

export const getPurchaseById = async (req, res) => {
  const { id } = req.params;

  const purchase = await Purchase.findById(id)
    .populate("items.materialId", "name")
    .populate("supplierId", "name phone address");

  if (!purchase) return res.status(404).json({ ok: false, message: "Purchase not found" });

  res.json({ ok: true, data: purchase });
};
