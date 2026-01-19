import mongoose from "mongoose";

const attributeSchema = new mongoose.Schema(
    {
        key: { type: String, required: true },
        label: { type: String, required: true },
        type: { type: String, enum: ["text", "select", "number"], default: "text" },
        required: { type: Boolean, default: false },
        options: { type: [String], default: [] },
    },
    { _id: false }
);

const rawMaterialSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        attributes: { type: [attributeSchema], default: [] },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model("RawMaterial", rawMaterialSchema);
