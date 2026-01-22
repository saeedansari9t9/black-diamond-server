import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
      index: true,
    },

    retailPrice: { type: Number, default: 0 },
    wholesalePrice: { type: Number, default: 0 },

    // auto sku (search)
    productId: { type: String, unique: true }, // P001
    sku: { type: String, required: true, unique: true, index: true },

    // material-specific attribute values (e.g. needleNo)
    attributes: { type: Object, default: {} },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
