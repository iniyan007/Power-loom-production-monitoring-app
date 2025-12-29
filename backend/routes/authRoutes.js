const router = require("express").Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Signup
router.post("/signup", async (req, res) => {
  const user = await User.create(req.body);
  res.json(user);
});

// Login
router.post("/login", async (req, res) => {
  const user = await User.findOne({
    email: req.body.email,
    password: req.body.password
  });

  if (!user) return res.status(401).send("Invalid credentials");

  const token = jwt.sign(
    { id: user._id, role: user.role },
    "SECRET"
  );

  res.json({ token, role: user.role });
});

module.exports = router;
