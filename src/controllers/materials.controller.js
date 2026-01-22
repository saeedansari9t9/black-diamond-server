import Material from "../models/Material.js";

export const createMaterial = async (req, res) => {
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

  console.log("Create Material Body:", req.body);
  try {
    const doc = await Material.create({
      name: name.trim(),
      attributes: attrs,
    });
    console.log("Material created:", doc);
    return res.status(201).json({ ok: true, data: doc });
  } catch (e) {
    console.error("Create Material Error:", e);
    return res.status(400).json({ ok: false, message: e.message });
  }
};

export const listMaterials = async (req, res) => {
  const data = await Material.find().sort({ name: 1 });
  res.json({ ok: true, data });
};

export const updateMaterial = async (req, res) => {
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
    const doc = await Material.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ ok: false, message: "Not found" });
    return res.json({ ok: true, data: doc });
  } catch (e) {
    return res.status(400).json({ ok: false, message: e.message });
  }
};

export const deleteMaterial = async (req, res) => {
  const { id } = req.params;
  try {
    await Material.findByIdAndDelete(id);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
};
