import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema(
    {
        materialId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RawMaterial",
            default: null,
        },
        description: { type: String, required: true }, // e.g. "Viscose Yarn"
        qty: { type: Number, required: true }, // e.g. weight
        unit: { type: String, default: "kg" }, // kg, unit, etc.
        price: { type: Number, required: true }, // cost per unit/kg
        lineTotal: { type: Number, required: true },
        attributes: { type: Map, of: String, default: {} },
    },
    { _id: false }
);

const purchaseSchema = new mongoose.Schema(
    {
        supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            default: null,
        },
        supplierSnapshot: {
            name: { type: String, default: "Walk-in" },
            phone: { type: String, default: "" },
        },
        purchaseNo: { type: String, required: true, unique: true, index: true },

        items: { type: [purchaseItemSchema], required: true },

        subTotal: { type: Number, required: true },
        grandTotal: { type: Number, required: true },

        paymentMethod: {
            type: String,
            enum: ["cash", "bank", "credit"],
            default: "cash",
        },
        paidAmount: { type: Number, default: 0 },
        dueAmount: { type: Number, default: 0 },

        note: { type: String, trim: true, default: "" },
    },
    { timestamps: true }
);

export default mongoose.model("Purchase", purchaseSchema);
