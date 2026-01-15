import Customer from "../models/Customer.js";
import Sale from "../models/Sale.js";

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
