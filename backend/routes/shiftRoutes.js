const router = require("express").Router();
const Shift = require("../models/Shift");
const Loom = require("../models/Loom");
const { auth, adminOnly } = require("../middleware/auth");

// ✅ Helper function to calculate shift end time
const getShiftEndTime = (shiftType, startTime) => {
  const start = new Date(startTime);
  const endTimes = {
    Morning: 14, // 2:00 PM
    Evening: 22, // 10:00 PM
    Night: 6     // 6:00 AM next day
  };

  const endHour = endTimes[shiftType];
  const end = new Date(start);
  
  if (shiftType === "Night") {
    // Night shift ends next day at 6 AM
    end.setDate(end.getDate() + 1);
    end.setHours(6, 0, 0, 0);
  } else {
    end.setHours(endHour, 0, 0, 0);
  }
  
  return end;
};

// Assign shift (Admin only)
router.post("/assign", auth, adminOnly, async (req, res) => {
  try {
    const { loomId, weaverId, shiftType, startTime } = req.body;

    // ✅ Complete any existing active shifts for this weaver on this loom
    await Shift.updateMany(
      {
        weaverId,
        loomId,
        completed: false,
      },
      {
        completed: true,
        endTime: new Date(),
      }
    );

    // ✅ Calculate shift end time
    const calculatedEndTime = getShiftEndTime(shiftType, startTime || new Date());

    const shift = await Shift.create({
      loomId,
      weaverId,
      shiftType,
      startTime: startTime || new Date(),
      endTime: calculatedEndTime,
      completed: false,
    });

    res.json(shift);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get active shift for logged-in weaver
router.get("/my-active-shift", auth, async (req, res) => {
  try {
    const shifts = await Shift.find({
      weaverId: req.user.id,
      completed: false
    })
      .populate("loomId")
      .sort({ createdAt: -1 });

    // ✅ Filter valid shifts and auto-complete expired ones
    const now = new Date();
    const validShifts = [];

    for (const shift of shifts) {
      // Check if loom exists and weaver is still assigned
      if (!shift.loomId || String(shift.loomId.currentWeaver) !== String(req.user.id)) {
        continue;
      }

      // ✅ Auto-complete shift if time has passed
      if (shift.endTime && now > new Date(shift.endTime)) {
        shift.completed = true;
        await shift.save();

        // Stop the loom if running
        if (shift.loomId.status === "running") {
          shift.loomId.status = "stopped";
          shift.loomId.runningSince = null;
          await shift.loomId.save();
        }
        continue;
      }

      validShifts.push(shift);
    }

    res.json(validShifts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Background job to auto-complete expired shifts (call this periodically)
router.post("/auto-complete-shifts", async (req, res) => {
  try {
    const now = new Date();
    
    // Find all incomplete shifts that have passed their end time
    const expiredShifts = await Shift.find({
      completed: false,
      endTime: { $lt: now }
    }).populate("loomId");

    let completedCount = 0;

    for (const shift of expiredShifts) {
      // Complete the shift
      shift.completed = true;
      await shift.save();

      // Stop the loom if running
      if (shift.loomId && shift.loomId.status === "running") {
        shift.loomId.status = "stopped";
        shift.loomId.runningSince = null;
        await shift.loomId.save();
      }

      completedCount++;
    }

    res.json({ 
      message: `Auto-completed ${completedCount} expired shifts`,
      count: completedCount 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Mark attendance
router.post("/attendance/:id", auth, async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);

    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    // Only the assigned weaver can mark attendance
    if (String(shift.weaverId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    shift.attendanceMarked = true;
    await shift.save();

    res.json(shift);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// End shift manually
router.post("/end/:id", auth, async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id).populate("loomId");

    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    // Only the assigned weaver can end their shift
    if (String(shift.weaverId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    shift.completed = true;
    shift.endTime = new Date();
    await shift.save();

    // Stop the loom if running
    if (shift.loomId && shift.loomId.status === "running") {
      shift.loomId.status = "stopped";
      shift.loomId.runningSince = null;
      await shift.loomId.save();
    }

    res.json(shift);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;