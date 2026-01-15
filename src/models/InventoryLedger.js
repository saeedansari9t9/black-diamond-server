import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    type: { type: String, enum: ["IN", "OUT", "ADJUST"], required: true },
    qty: { type: Number, required: true },          // + for IN, - for OUT/ADJUST (we will store signed)
    refType: { type: String, enum: ["SALE", "PURCHASE", "MANUAL"], default: "MANUAL" },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null }, // saleId etc
    note: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

ledgerSchema.index({ productId: 1, createdAt: -1 });

export default mongoose.model("InventoryLedger", ledgerSchema);
