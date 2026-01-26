import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    phone: { type: String, trim: true, index: true, default: "" },
    address: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    walletBalance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

customerSchema.index({ name: 1, phone: 1 });

export default mongoose.model("Customer", customerSchema);
