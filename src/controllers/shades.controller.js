import Shade from "../models/Shade.js";

export const createShade = async (req, res) => {
  const { materialId, shadeCode, shadeName } = req.body;
  const doc = await Shade.create({
    materialId,
    shadeCode: String(shadeCode).trim(),
    shadeName: shadeName?.trim() || "",
  });
  res.status(201).json({ ok: true, data: doc });
};

export const listShades = async (req, res) => {
  const { materialId, q } = req.query;

  const filter = {};
  if (materialId) filter.materialId = materialId;
  if (q) filter.shadeCode = { $regex: q, $options: "i" };

  const data = await Shade.find(filter)
    .populate("materialId", "name")
    .sort({ createdAt: -1 });

  res.json({ ok: true, data });
};
