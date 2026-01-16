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

  const doc = await Material.create({
    name: name.trim(),
    attributes: attrs,
  });
  return res.status(201).json({ ok: true, data: doc });
};

export const listMaterials = async (req, res) => {
  const data = await Material.find().sort({ name: 1 });
  res.json({ ok: true, data });
};
