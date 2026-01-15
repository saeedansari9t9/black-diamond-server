import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    qty: { type: Number, required: true }, // cones
    price: { type: Number, required: true }, // per cone
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    customerSnapshot: {
      name: { type: String, default: "Walk-in" },
      phone: { type: String, default: "" },
    },
    invoiceNo: { type: String, required: true, unique: true, index: true },

    customerName: { type: String, trim: true, default: "Walk-in" }, // abhi simple
    saleType: {
      type: String,
      enum: ["retail", "wholesale"],
      default: "retail",
    },

    items: { type: [saleItemSchema], required: true },

    subTotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
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

export default mongoose.model("Sale", saleSchema);
