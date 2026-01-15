import Product from "../models/Product.js";
import Shade from "../models/Shade.js";
import Material from "../models/Material.js";

const toKey = (s) => String(s || "").trim().toLowerCase();

const materialShort = (name) => {
  const n = toKey(name);
  if (n.startsWith("vis")) return "VIS";
  if (n.startsWith("pol")) return "POL";     // polister / polyester
  if (n.startsWith("zar")) return "ZAR";
  return "OTH";
};

// SKU examples (quality type removed, variant kept for polyester):
// VIS-3000
// POL-4001-SMALL
// POL-4001-BIG
const makeSKU = ({ matShort, shadeCode, variant }) => {
  const s = String(shadeCode || "0000").toUpperCase();
  if (variant) return `${matShort}-${s}-${String(variant).toUpperCase()}`;
  return `${matShort}-${s}`;
};

export const createProduct = async (req, res) => {
  const { materialId, shadeId, qualityType, variant = "", attributes = {}, retailPrice, wholesalePrice } = req.body || {};

  if (!materialId) {
    return res.status(400).json({
      ok: false,
      message: "materialId is required",
    });
  }

  const material = await Material.findById(materialId);
  if (!material) return res.status(404).json({ ok: false, message: "Material not found" });

  // ✅ shadeId required only if material uses shades
  if (material.useShade !== false && !shadeId) {
    return res.status(400).json({ ok: false, message: "shadeId is required for this material" });
  }

  // ✅ qualityType required only if material uses quality
  if (material.useQuality !== false && !qualityType) {
    return res.status(400).json({ ok: false, message: "qualityType is required for this material" });
  }

  const shade = shadeId ? await Shade.findById(shadeId) : null;
  if (shadeId && !shade) return res.status(404).json({ ok: false, message: "Shade not found" });

  const mName = toKey(material.name);
  let v = toKey(variant);

  // ✅ variant rule: only polyester/polister can have variant (small/big)
  const isPoly = mName.includes("pol"); // polister / polyester
  if (!isPoly) {
    v = ""; // ignore for viscose/zari
  } else {
    if (v && !["small", "big"].includes(v)) {
      return res.status(400).json({ ok: false, message: "variant must be 'small' or 'big' for polister" });
    }
  }

  const sku = makeSKU({
    matShort: materialShort(material.name),
    shadeCode: shade?.shadeCode || "0000",
    variant: v,
  });

  // Optional: protect against duplicates early (nice message)
  const filter = {
    materialId,
    variant: v,
  };
  if (shadeId) filter.shadeId = shadeId;
  if (qualityType) filter.qualityType = qualityType;

  const exists = await Product.findOne(filter);
  if (exists) {
    return res.status(409).json({ ok: false, message: "Product already exists for this combination" });
  }

  const productData = {
    materialId,
    variant: v,
    retailPrice: Number(retailPrice || 0),
    wholesalePrice: Number(wholesalePrice || 0),
    sku,
    attributes: attributes || {},
  };

  if (shadeId) productData.shadeId = shadeId;
  if (qualityType) productData.qualityType = qualityType;

  const doc = await Product.create(productData);

  res.status(201).json({ ok: true, data: doc });
};

export const listProducts = async (req, res) => {
  const { materialId, shadeId, qualityType, variant, q } = req.query;

  const filter = {};
  if (materialId) filter.materialId = materialId;
  if (shadeId) filter.shadeId = shadeId;
  if (qualityType) filter.qualityType = qualityType;
  if (variant !== undefined) filter.variant = toKey(variant);
  if (q) filter.sku = { $regex: q, $options: "i" };

  const data = await Product.find(filter)
    .populate("materialId", "name")
    .populate("shadeId", "shadeCode shadeName")
    .sort({ createdAt: -1 });

  res.json({ ok: true, data });
};
