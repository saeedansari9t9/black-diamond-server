import Product from "../models/Product.js";
import Material from "../models/Material.js";
import StockLedger from "../models/StockLedger.js";

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
    const { materialId, attributes = {}, retailPrice, wholesalePrice, initialStock } = req.body || {};

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

    // Generate Product ID
    const lastProduct = await Product.findOne().sort({ createdAt: -1 });
    let nextId = "P001";
    if (lastProduct && lastProduct.productId) {
      const num = parseInt(lastProduct.productId.substring(1));
      if (!isNaN(num)) {
        nextId = `P${String(num + 1).padStart(3, "0")}`;
      }
    }

    const productData = {
      productId: nextId,
      materialId,
      retailPrice: Number(retailPrice || 0),
      wholesalePrice: Number(wholesalePrice || 0),
      sku,
      attributes: attributes || {},
    };

    const doc = await Product.create(productData);

    // Initial Stock (Opening Stock)
    if (initialStock && Number(initialStock) > 0) {
      await StockLedger.create({
        productId: doc._id,
        type: "adjust", // Treating as adjustment/opening
        qtyChange: Number(initialStock),
        note: "Opening Stock",
      });
    }

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
// Update a product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { materialId, attributes, retailPrice, wholesalePrice } = req.body;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ ok: false, message: "Product not found" });

    // If attributes change, we might need to regenerate SKU
    // For now, let's regenerate SKU if material or attributes change
    let sku = product.sku;
    if (materialId || attributes) {
      const matId = materialId || product.materialId;
      const attrs = attributes || product.attributes;
      const material = await Material.findById(matId);
      if (material) {
        // Logic to make SKU (reused from create)
        // We can refactor makeSKU to be exported or used here helper
        // For simplicity, let's assume makeSKU is available in scope (it is)
        sku = makeSKU({ material, attributes: attrs });
      }
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      {
        materialId: materialId || product.materialId,
        attributes: attributes || product.attributes,
        retailPrice: retailPrice !== undefined ? Number(retailPrice) : product.retailPrice,
        wholesalePrice: wholesalePrice !== undefined ? Number(wholesalePrice) : product.wholesalePrice,
        sku
      },
      { new: true }
    );
    res.json({ ok: true, data: updated });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
};

// Delete a product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.json({ ok: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
};
