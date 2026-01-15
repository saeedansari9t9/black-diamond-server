import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./models/User.js";

await mongoose.connect(process.env.MONGO_URI);
console.log("DB connected");

const email = "admin@blackdiamond.com";
const password = "Admin@12345";

const exists = await User.findOne({ email });
if (exists) {
  console.log("Admin already exists:", email);
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 10);
await User.create({ name: "Admin", email, passwordHash, role: "admin" });

console.log("✅ Admin created");
console.log("Email:", email);
console.log("Password:", password);
process.exit(0);
