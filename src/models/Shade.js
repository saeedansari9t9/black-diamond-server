import mongoose from "mongoose";

const shadeSchema = new mongoose.Schema(
  {
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
      index: true,
    },
    shadeCode: { type: String, required: true, trim: true }, // 3000, 3001, 3476
    shadeName: { type: String, trim: true }, // optional
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// same material ke andar shadeCode unique ho
shadeSchema.index({ materialId: 1, shadeCode: 1 }, { unique: true });

export default mongoose.model("Shade", shadeSchema);
