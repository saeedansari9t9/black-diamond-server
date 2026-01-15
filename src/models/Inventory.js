import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, unique: true },
    qty: { type: Number, default: 0 }, // current stock (cones / units)
    minQty: { type: Number, default: 0 }, // optional low-stock threshold
  },
  { timestamps: true }
);

export default mongoose.model("Inventory", inventorySchema);
