const router = require("express").Router();
const Shift = require("../models/Shift");
const { auth } = require("../middleware/auth");

// Assign shift
router.post("/assign", auth, async (req, res) => {
  const shift = await Shift.create(req.body);
  res.json(shift);
});

// Mark attendance
router.post("/attendance/:id", auth, async (req, res) => {
  const shift = await Shift.findByIdAndUpdate(
    req.params.id,
    { attendanceMarked: true },
    { new: true }
  );
  res.json(shift);
});

// End shift
router.post("/end/:id", auth, async (req, res) => {
  const shift = await Shift.findByIdAndUpdate(
    req.params.id,
    { completed: true, endTime: new Date() },
    { new: true }
  );
  res.json(shift);
});

module.exports = router;
