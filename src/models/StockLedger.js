import mongoose from "mongoose";

const stockLedgerSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },

    // purchase_add (+), sale_out (-), adjust (+/-)
    type: { type: String, enum: ["purchase_add", "sale_out", "adjust"], required: true },

    qtyChange: { type: Number, required: true }, // cones (+ add, - minus)

    note: { type: String, trim: true, default: "" },

    refType: { type: String, trim: true, default: "" }, // optional: "purchase" | "sale"
    refId: { type: mongoose.Schema.Types.ObjectId },     // optional link
  },
  { timestamps: true }
);

export default mongoose.model("StockLedger", stockLedgerSchema);
