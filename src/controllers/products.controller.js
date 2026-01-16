import Product from "../models/Product.js";
import Material from "../models/Material.js";

// SKU generated from material short name (first 3 chars) + shade number from attributes (if available)
// Example: POL-20, VIS-15, ZAR-05, GLU-1 (or just GLU if no shade in attributes)
const makeSKU = ({ material, attributes }) => {
  // If material has attributes, use first attribute value
  if (material.attributes && material.attributes.length > 0) {
    const matShort = material.name.substring(0, 3).toUpperCase();
    const firstAttrKey = material.attributes[0].key;
    let firstAttrValue = attributes?.[firstAttrKey] || "";

    if (firstAttrValue) {
      // Convert to uppercase and replace spaces with hyphens
      firstAttrValue = String(firstAttrValue).toUpperCase().replace(/\s+/g, '-');
      return `${matShort}-${firstAttrValue}`;
    }
    // If first attribute value is empty, still use short name with placeholder
    return `${matShort}-EMPTY`;
  }

  // If no attributes, use full material name (uppercase, replace spaces with hyphens)
  return material.name.toUpperCase().replace(/\s+/g, '-');
};

export const createProduct = async (req, res) => {
  try {
    const { materialId, attributes = {}, retailPrice, wholesalePrice } = req.body || {};

    if (!materialId) {
      return res.status(400).json({
        ok: false,
        message: "materialId is required",
      });
    }

    const material = await Material.findById(materialId);
    if (!material) return res.status(404).json({ ok: false, message: "Material not found" });

    // Generic validation for all required attributes
    if (material.attributes && material.attributes.length > 0) {
      for (const attr of material.attributes) {
        if (attr.required) {
          const value = attributes?.[attr.key];
          if (!value || (typeof value === 'string' && !value.trim())) {
            return res.status(400).json({
              ok: false,
              message: `${attr.label || attr.key} is required`
            });
          }
        }
      }
    }

    const sku = makeSKU({ material, attributes });

    // Check if exact duplicate exists (same SKU)
    const exists = await Product.findOne({ sku });
    if (exists) {
      return res.status(409).json({ ok: false, message: "Product with this SKU already exists" });
    }

    const productData = {
      materialId,
      retailPrice: Number(retailPrice || 0),
      wholesalePrice: Number(wholesalePrice || 0),
      sku,
      attributes: attributes || {},
    };

    const doc = await Product.create(productData);

    res.status(201).json({ ok: true, data: doc });
  } catch (err) {
    console.error("Product creation error:", err);
    res.status(500).json({ ok: false, message: err.message || "Failed to create product" });
  }
};

export const listProducts = async (req, res) => {
  const { materialId, q } = req.query;

  const filter = {};
  if (materialId) filter.materialId = materialId;
  if (q) filter.sku = { $regex: q, $options: "i" };

  const data = await Product.find(filter)
    .populate("materialId", "name")
    .sort({ createdAt: -1 });

  res.json({ ok: true, data });
};
