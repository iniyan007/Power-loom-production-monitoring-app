const router = require("express").Router();
const Loom = require("../models/Loom");
const { auth, adminOnly } = require("../middleware/auth");

// Create Loom (Admin)
router.post("/", auth, adminOnly, async (req, res) => {
  const loom = await Loom.create(req.body);
  res.json(loom);
});

// Get All Looms
router.get("/", auth, async (req, res) => {
  const looms = await Loom.find().populate("currentWeaver");
  res.json(looms);
});

module.exports = router;
