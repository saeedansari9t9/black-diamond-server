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
