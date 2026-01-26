import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, trim: true, default: "" },
        address: { type: String, trim: true, default: "" },
        category: { type: String, required: true, trim: true },
        walletBalance: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model("Supplier", supplierSchema);
