import bcrypt from "bcrypt";
import User from "../models/User.js";

// GET /api/users
export const listUsers = async (req, res) => {
  const { q, role, active } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (active === "true") filter.isActive = true;
  if (active === "false") filter.isActive = false;

  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  const data = await User.find(filter)
    .select("_id name email role isActive createdAt")
    .sort({ createdAt: -1 });

  res.json({ ok: true, data });
};

// POST /api/users  (admin creates user)
export const createUser = async (req, res) => {
  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password || !role) {
    return res.status(400).json({ ok: false, message: "name, email, password, role required" });
  }

  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) return res.status(409).json({ ok: false, message: "Email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role,
    isActive: true,
  });

  res.status(201).json({
    ok: true,
    data: { id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive },
  });
};

// PATCH /api/users/:id/status
export const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body || {};

  if (typeof isActive !== "boolean") {
    return res.status(400).json({ ok: false, message: "isActive(boolean) required" });
  }

  const user = await User.findByIdAndUpdate(
    id,
    { isActive },
    { new: true }
  ).select("_id name email role isActive createdAt");

  if (!user) return res.status(404).json({ ok: false, message: "User not found" });

  res.json({ ok: true, data: user });
};

// PUT /api/users/:id
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body || {};

  const updates = {};
  if (name) updates.name = name.trim();
  if (email) updates.email = email.toLowerCase().trim();
  if (role) updates.role = role;
  if (password) updates.passwordHash = await bcrypt.hash(password, 10);

  // Check email uniqueness if changing
  if (updates.email) {
    const exists = await User.findOne({ email: updates.email, _id: { $ne: id } });
    if (exists) return res.status(409).json({ ok: false, message: "Email already taken" });
  }

  const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("-passwordHash");
  if (!user) return res.status(404).json({ ok: false, message: "User not found" });

  res.json({ ok: true, data: user });
};

// DELETE /api/users/:id
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  if (!user) return res.status(404).json({ ok: false, message: "User not found" });
  res.json({ ok: true, message: "User deleted" });
};