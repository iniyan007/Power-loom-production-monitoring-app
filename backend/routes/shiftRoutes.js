const router = require("express").Router();
const Shift = require("../models/Shift");
const { auth } = require("../middleware/auth");

// Assign shift
router.post("/assign", auth, async (req, res) => {
  const { loomId, weaverId, shiftType, startTime } = req.body;

  // ❗ END ANY PREVIOUS ACTIVE SHIFT
  await Shift.updateMany(
    { weaverId, completed: false },
    { completed: true, endTime: new Date() }
  );

  const shift = await Shift.create({
    loomId,
    weaverId,
    shiftType,
    startTime,
    completed: false
  });

  res.json(shift);
});

// Get active shift for logged-in weaver
router.get("/my-active-shift", auth, async (req, res) => {
  const shift = await Shift.findOne({
    weaverId: req.user.id,
    completed: false
  })
    .sort({ createdAt: -1 }) // 🔥 IMPORTANT
    .populate("loomId");

  if (
    !shift ||
    !shift.loomId ||
    String(shift.loomId.currentWeaver) !== String(req.user.id)
  ) {
    return res.json(null);
  }

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
