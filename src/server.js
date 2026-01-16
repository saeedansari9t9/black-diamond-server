import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import mongoose from "mongoose";

const PORT = process.env.PORT || 5000;

await connectDB();

// Drop old indexes that no longer exist in the schema
try {
  const db = mongoose.connection.db;
  const collection = db.collection("products");

  // Drop old indexes
  const oldIndexNames = [
    "materialId_1_shadeId_1_size_1_qualityType_1",
    "materialId_1_qualityType_1_variant_1"
  ];

  for (const indexName of oldIndexNames) {
    try {
      await collection.dropIndex(indexName);
      console.log(`✅ Dropped old index: ${indexName}`);
    } catch (err) {
      if (!err.message.includes("index not found")) {
        console.warn(`⚠️ Could not drop index ${indexName}: ${err.message}`);
      }
    }
  }
} catch (err) {
  console.warn("Could not cleanup indexes:", err.message);
}

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
