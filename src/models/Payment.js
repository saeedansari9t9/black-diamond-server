import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
        },
        supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
        },
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        note: { type: String, default: "" },

        // Track which docs this payment paid off
        appliedTo: [
            {
                saleId: { type: mongoose.Schema.Types.ObjectId, ref: "Sale" },
                purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" },
                invoiceNo: String, // or purchaseNo
                amount: Number,
            }
        ]
    },
    { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
