import Supplier from "../models/Supplier.js";

// Get all suppliers
export const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 });
        res.json({ ok: true, data: suppliers });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

// Create a new supplier
export const createSupplier = async (req, res) => {
    try {
        const { name, phone, address, category } = req.body;
        if (!name) return res.status(400).json({ ok: false, message: "Name is required" });
        if (!category) return res.status(400).json({ ok: false, message: "Category is required" });

        const existing = await Supplier.findOne({
            name: { $regex: new RegExp(`^${name}$`, "i") }
        });

        if (existing) {
            return res.json({ ok: true, data: existing, message: "Supplier already exists" });
        }

        const supplier = await Supplier.create({ name, phone, address, category });
        res.status(201).json({ ok: true, data: supplier });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};
// Update a supplier
export const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, address, category } = req.body;
        const updated = await Supplier.findByIdAndUpdate(
            id,
            { name, phone, address, category },
            { new: true }
        );
        res.json({ ok: true, data: updated });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

// Delete a supplier
export const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        await Supplier.findByIdAndDelete(id);
        res.json({ ok: true, message: "Supplier deleted" });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

// GET /api/suppliers/:id/ledger
export const getLedger = async (req, res) => {
    const { id } = req.params;

    // 1. Get Supplier Details
    const supplier = await Supplier.findById(id);
    if (!supplier) return res.status(404).json({ ok: false, message: "Supplier not found" });

    // 2. Get Unpaid/Partial Purchases (for FIFO calculation visual)
    // We need to import Purchase model
    const Purchase = (await import("../models/Purchase.js")).default;

    const unpaidPurchases = await Purchase.find({
        supplierId: id,
        dueAmount: { $gt: 0 }
    }).sort({ createdAt: 1 }); // Oldest first

    // 3. Get Payment History (Outbound)
    const Payment = (await import("../models/Payment.js")).default;
    const payments = await Payment.find({ supplierId: id }).sort({ createdAt: -1 }).limit(50);

    // 4. Calculate Totals
    const totalDue = unpaidPurchases.reduce((sum, p) => sum + p.dueAmount, 0);

    res.json({
        ok: true,
        data: {
            supplier,
            totalDue,
            unpaidPurchases,
            payments
        }
    });
};

// POST /api/suppliers/:id/pay
export const paySupplier = async (req, res) => {
    const { id } = req.params;
    const { amount, date, note } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ ok: false, message: "Valid amount required" });
    }

    const Purchase = (await import("../models/Purchase.js")).default;
    const Payment = (await import("../models/Payment.js")).default;

    // 1. Fetch unpaid purchases (FIFO)
    const unpaidPurchases = await Purchase.find({
        supplierId: id,
        dueAmount: { $gt: 0 }
    }).sort({ createdAt: 1 }); // Oldest first

    let remainingPayment = Number(amount);
    const appliedTo = [];

    // 2. Allocate Payment
    for (const pur of unpaidPurchases) {
        if (remainingPayment <= 0) break;

        const due = pur.dueAmount;
        const pay = Math.min(remainingPayment, due);

        // Update Purchase
        pur.paidAmount += pay;
        pur.dueAmount -= pay;
        await pur.save();

        // Track allocation
        appliedTo.push({
            purchaseId: pur._id,
            invoiceNo: pur.purchaseNo,
            amount: pay
        });

        remainingPayment -= pay;
    }

    // 3. Handle Surplus / Wallet Update
    let walletCredit = 0;
    if (remainingPayment > 0) {
        walletCredit = remainingPayment;
        // Update Supplier Wallet
        const supplier = await Supplier.findById(id);
        if (supplier) {
            supplier.walletBalance = (supplier.walletBalance || 0) + walletCredit;
            await supplier.save();
        }
    }

    // 4. Create Payment Record (Outbound)
    // We use the same Payment model but with supplierId
    const payment = await Payment.create({
        supplierId: id,
        amount: Number(amount),
        date: date || new Date(),
        note: walletCredit > 0 ? `${note || ""} (Credit Added to Wallet: ${walletCredit})` : note,
        appliedTo
    });

    res.json({ ok: true, data: payment, message: "Payment recorded" });
};
