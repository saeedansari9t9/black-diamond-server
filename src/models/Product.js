import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
      index: true,
    },
    shadeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shade",
      default: null,
      index: true,
    },

    // fresh vs redyeing
    qualityType: {
      type: String,
      enum: ["", "fresh", "redyeing"],
      default: "",
    },

    // ONLY for polyester: small/big
    // viscose/zari: ""
    variant: {
      type: String,
      enum: ["", "small", "big"],
      default: "",
      index: true,
    },

    retailPrice: { type: Number, default: 0 },
    wholesalePrice: { type: Number, default: 0 },

    // auto sku (search)
    sku: { type: String, required: true, unique: true, index: true },

    // material-specific attribute values (e.g. needleNo)
    attributes: { type: Object, default: {} },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// prevent duplicates even if sku changes
productSchema.index(
  { materialId: 1, shadeId: 1, qualityType: 1, variant: 1 },
  { unique: true }
);

export default mongoose.model("Product", productSchema);
