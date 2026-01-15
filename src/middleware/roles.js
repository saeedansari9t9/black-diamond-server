export const requireRole = (...roles) => (req, res, next) => {
  const role = req.user?.role;
  if (!role) return res.status(401).json({ ok: false, message: "Unauthorized" });
  if (!roles.includes(role)) return res.status(403).json({ ok: false, message: "Forbidden" });
  next();
};
