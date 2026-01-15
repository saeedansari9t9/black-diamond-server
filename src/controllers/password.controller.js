import bcrypt from "bcrypt";
import User from "../models/User.js";

// POST /api/password/change  (logged in user)
export const changeMyPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ ok: false, message: "oldPassword and newPassword required" });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ ok: false, message: "User not found" });

  const ok = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ ok: false, message: "Old password is incorrect" });

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ ok: true, message: "Password updated" });
};

// POST /api/password/reset/:id (admin only)
export const adminResetPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body || {};

  if (!newPassword) {
    return res.status(400).json({ ok: false, message: "newPassword required" });
  }

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ ok: false, message: "User not found" });

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ ok: true, message: "Password reset" });
};
