const jwt = require("jsonwebtoken");

exports.auth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send("No token");

  try {
    const decoded = jwt.verify(token, "thisisiniyanfromeie");
    req.user = decoded;
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).send("Access denied");
  next();
};
