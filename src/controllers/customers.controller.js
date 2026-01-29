import Customer from "../models/Customer.js";
import Sale from "../models/Sale.js";
import Payment from "../models/Payment.js";

export const listCustomers = async (req, res) => {
  const { q } = req.query;
  const filter = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
    ];
  }
  const data = await Customer.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json({ ok: true, data });
};

export const createCustomer = async (req, res) => {
  const { name, phone = "", address = "", notes = "" } = req.body || {};
  if (!name) return res.status(400).json({ ok: false, message: "name required" });

  const doc = await Customer.create({
    name: name.trim(),
    phone: phone.trim(),
    address: address.trim(),
    notes: notes.trim(),
  });

  res.status(201).json({ ok: true, data: doc });
};

export const getCustomerHistory = async (req, res) => {
  const { id } = req.params;

  const sales = await Sale.find({ customerId: id })
    .sort({ createdAt: -1 })
    .select("invoiceNo grandTotal paidAmount dueAmount saleType createdAt items");

  res.json({ ok: true, data: sales });
};

export const getLedger = async (req, res) => {
  const { id } = req.params;

  // 1. Get Customer Details
  const customer = await Customer.findById(id);
  if (!customer) return res.status(404).json({ ok: false, message: "Customer not found" });

  // 2. Get Unpaid/Partial Invoices (for FIFO calculation visual)
  const unpaidInvoices = await Sale.find({
    customerId: id,
    dueAmount: { $gt: 0 }
  }).sort({ createdAt: 1 }); // Oldest first

  // 3. Get Payment History
  const payments = await Payment.find({ customerId: id }).sort({ createdAt: -1 }).limit(50);

  // 4. Calculate Totals
  const totalDue = unpaidInvoices.reduce((sum, sale) => sum + sale.dueAmount, 0);

  res.json({
    ok: true,
    data: {
      customer,
      totalDue,
      unpaidInvoices,
      payments
    }
  });
};

export const addPayment = async (req, res) => {
  const { id } = req.params;
  const { amount, date, note } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ ok: false, message: "Valid amount required" });
  }

  // 1. Fetch unpaid invoices (FIFO)
  const unpaidSales = await Sale.find({
    customerId: id,
    dueAmount: { $gt: 0 }
  }).sort({ createdAt: 1 }); // Oldest first

  let remainingPayment = Number(amount);
  const appliedTo = [];

  // 2. Allocate Payment
  for (const sale of unpaidSales) {
    if (remainingPayment <= 0) break;

    const due = sale.dueAmount;
    const pay = Math.min(remainingPayment, due);

    // Update Sale
    sale.paidAmount += pay;
    sale.dueAmount -= pay;
    await sale.save();

    // Track allocation
    appliedTo.push({
      saleId: sale._id,
      invoiceNo: sale.invoiceNo,
      amount: pay
    });

    remainingPayment -= pay;
  }

  // 3. Handle Surplus / Wallet Update
  let walletCredit = 0;
  if (remainingPayment > 0) {
    walletCredit = remainingPayment;
    // Update Customer Wallet
    const customer = await Customer.findById(id);
    if (customer) {
      customer.walletBalance = (customer.walletBalance || 0) + walletCredit;
      await customer.save();
    }
  }

  // 4. Create Payment Record
  const payment = await Payment.create({
    customerId: id,
    amount: Number(amount),
    date: date || new Date(),
    note: walletCredit > 0 ? `${note || ""} (Credit Added to Wallet: ${walletCredit})` : note,
    appliedTo
  });

  res.json({ ok: true, data: payment, message: "Payment recorded" });
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, notes } = req.body;

    if (!name) return res.status(400).json({ ok: false, message: "Name is required" });

    const updated = await Customer.findByIdAndUpdate(
      id,
      { name, phone, address, notes },
      { new: true }
    );

    if (!updated) return res.status(404).json({ ok: false, message: "Customer not found" });

    res.json({ ok: true, data: updated, message: "Customer updated" });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Customer.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ ok: false, message: "Customer not found" });
    res.json({ ok: true, message: "Customer deleted" });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
};
