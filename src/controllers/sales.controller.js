import Sale from "../models/Sale.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import StockLedger from "../models/StockLedger.js";
import { makeInvoiceNo } from "../utils/invoice.js";

export const createSale = async (req, res) => {
  const {
    customerId,
    customerName,
    customerPhone, // New field
    saleType,
    items,
    discount = 0,
    paymentMethod = "cash",
    paidAmount = 0,
    note = "",
  } = req.body || {};

  // ✅ Resolve Walk-in Customer (if phone provided)
  let resolvedCustomerId = customerId;
  let resolvedCustomerName = customerName?.trim() || "Walk-in";
  let isNewCustomer = false;

  if (!resolvedCustomerId && customerPhone && customerPhone.trim()) {
    const phone = customerPhone.trim();
    // 1. Check if customer exists by phone
    let customer = await Customer.findOne({ phone });

    if (customer) {
      // Found existing customer -> Use their ID
      resolvedCustomerId = customer._id;
      // Optional: Update name if you want to sync, or just keep what was typed.
      // For now, let's prefer the existing customer's registered name to keep data consistent
      resolvedCustomerName = customer.name;
    } else {
      // 2. Not found -> Create new customer
      // We need a name. If users left it blank but gave a phone, we might fallback to "Customer {phone}"
      const newName = resolvedCustomerName !== "Walk-in" ? resolvedCustomerName : `Customer ${phone}`;

      customer = await Customer.create({
        name: newName,
        phone: phone,
        address: "", // optional
        notes: "Created from Walk-in Sale",
      });
      resolvedCustomerId = customer._id;
      resolvedCustomerName = customer.name;
      isNewCustomer = true;
    }
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, message: "items required" });
  }

  // ✅ validate items & calculate totals
  let subTotal = 0;
  const normalizedItems = [];

  for (const it of items) {
    const { productId, qty, price } = it || {};
    if (!productId || !qty || !price) {
      return res.status(400).json({ ok: false, message: "Each item requires productId, qty, price" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ ok: false, message: "Product not found" });

    const lineTotal = Number(qty) * Number(price);
    subTotal += lineTotal;

    normalizedItems.push({
      productId,
      qty: Number(qty),
      price: Number(price),
      lineTotal,
    });
  }

  const grandTotal = Math.max(0, subTotal - Number(discount || 0));
  let paid = Number(paidAmount || 0);
  let dueAmount = Math.max(0, grandTotal - paid);
  let finalNote = note;

  // ✅ Automatic Wallet Deduction
  if (resolvedCustomerId && dueAmount > 0) {
    const customer = await Customer.findById(resolvedCustomerId);
    if (customer && customer.walletBalance > 0) {
      const deduction = Math.min(customer.walletBalance, dueAmount);

      if (deduction > 0) {
        paid += deduction;
        dueAmount -= deduction;
        customer.walletBalance -= deduction;
        await customer.save();

        finalNote = `${finalNote ? finalNote + ". " : ""}Paid from Wallet: ${deduction}`;
      }
    }
  }

  /* Sequential Invoice Logic */
  const lastSale = await Sale.findOne().sort({ createdAt: -1 });
  let nextNum = 10001;
  if (lastSale && lastSale.invoiceNo && lastSale.invoiceNo.startsWith("BD-")) {
    const parts = lastSale.invoiceNo.split("-");
    const lastN = parseInt(parts[1]);
    if (!isNaN(lastN)) nextNum = lastN + 1;
  }
  const invoiceNo = `BD-${nextNum}`;

  let customerSnapshot = { name: resolvedCustomerName, phone: customerPhone || "" };

  if (resolvedCustomerId) {
    // optional: fetch customer to save snapshot and ensure name is correct
    const c = await Customer.findById(resolvedCustomerId);
    if (c) {
      resolvedCustomerName = c.name; // Override "Walk-in"
      customerSnapshot = { name: c.name, phone: c.phone || "" };
    }
  }

  // ✅ Create sale doc
  const sale = await Sale.create({
    customerId: resolvedCustomerId || null,
    customerSnapshot,
    invoiceNo,
    customerName: resolvedCustomerName,
    saleType: saleType || "retail",
    items: normalizedItems,
    subTotal,
    discount: Number(discount || 0),
    grandTotal,
    paymentMethod,
    paidAmount: paid,
    dueAmount,
    note: finalNote,
    isNewCustomer, // Save the flag
  });

  // ✅ Stock ledger entries (minus stock)
  const ledgerDocs = normalizedItems.map((it) => ({
    productId: it.productId,
    type: "sale_out",
    qtyChange: -Math.abs(it.qty),
    note: `Sale ${invoiceNo}`,
    refType: "sale",
    refId: sale._id,
  }));

  await StockLedger.insertMany(ledgerDocs);

  res.status(201).json({ ok: true, data: sale });
};

export const listSales = async (req, res) => {
  const { from, to } = req.query;

  const filter = {};
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const data = await Sale.find(filter)
    .populate({
      path: "items.productId",
      select: "sku size qualityType materialId",
      populate: { path: "materialId", select: "name" }
    })
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ ok: true, data });
};

export const getSaleById = async (req, res) => {
  const { id } = req.params;

  try {
    const sale = await Sale.findById(id)
      .populate({
        path: "items.productId",
        select: "sku size qualityType materialId",
        populate: [
          { path: "materialId", select: "name" },
        ],
      })
      .populate({ path: "customerId", select: "name phone address" });

    if (!sale) return res.status(404).json({ ok: false, message: "Sale not found" });

    res.json({ ok: true, data: sale });
  } catch (error) {
    console.error("getSaleById error:", error);
    res.status(500).json({ ok: false, message: error.message });
  }
};
