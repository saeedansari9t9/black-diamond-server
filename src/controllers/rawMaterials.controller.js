import RawMaterial from "../models/RawMaterial.js";

export const createRawMaterial = async (req, res) => {
    const { name, attributes } = req.body || {};

    if (!name) {
        return res.status(400).json({ ok: false, message: "name is required" });
    }

    // basic attributes validation if provided
    const attrs = Array.isArray(attributes)
        ? attributes.map((a) => ({
            key: String(a.key || "").trim(),
            label: String(a.label || "").trim(),
            type: ["text", "select", "number"].includes(a.type) ? a.type : "text",
            required: !!a.required,
            options: Array.isArray(a.options) ? a.options.map(String) : [],
        }))
        : [];

    try {
        const doc = await RawMaterial.create({
            name: name.trim(),
            attributes: attrs,
        });
        return res.status(201).json({ ok: true, data: doc });
    } catch (error) {
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ ok: false, message: "Raw Material already exists" });
        }
        return res.status(500).json({ ok: false, message: error.message });
    }
};

export const listRawMaterials = async (req, res) => {
    try {
        const { q } = req.query;
        const filter = { isActive: true };
        if (q) filter.name = { $regex: q, $options: "i" };

        const data = await RawMaterial.find(filter).sort({ name: 1 });
        res.json({ ok: true, data });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
};

export const updateRawMaterial = async (req, res) => {
    const { id } = req.params;
    const { name, attributes } = req.body || {};

    const attrs = Array.isArray(attributes)
        ? attributes.map((a) => ({
            key: String(a.key || "").trim(),
            label: String(a.label || "").trim(),
            type: ["text", "select", "number"].includes(a.type) ? a.type : "text",
            required: !!a.required,
            options: Array.isArray(a.options) ? a.options.map(String) : [],
        }))
        : [];

    const update = { attributes: attrs };
    if (name) update.name = name.trim();

    try {
        const doc = await RawMaterial.findByIdAndUpdate(id, update, { new: true });
        if (!doc) return res.status(404).json({ ok: false, message: "Not found" });
        return res.json({ ok: true, data: doc });
    } catch (e) {
        return res.status(400).json({ ok: false, message: e.message });
    }
};

export const deleteRawMaterial = async (req, res) => {
    const { id } = req.params;
    try {
        await RawMaterial.findByIdAndDelete(id); // Or soft delete: findByIdAndUpdate(id, { isActive: false })
        return res.json({ ok: true });
    } catch (e) {
        return res.status(500).json({ ok: false, message: e.message });
    }
};
