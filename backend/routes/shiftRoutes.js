const router = require("express").Router();
const Shift = require("../models/Shift");
const Loom = require("../models/Loom");
const { auth, adminOnly } = require("../middleware/auth");

// ✅ Helper function to calculate shift start and end times based on date
const calculateShiftTimes = (shiftType, scheduledDate) => {
  // Parse the scheduled date (YYYY-MM-DD format)
  const date = new Date(scheduledDate);
  
  const shiftConfig = {
    Morning: { startHour: 6, startMinute: 0, endHour: 14, endMinute: 0 },
    Evening: { startHour: 14, startMinute: 0, endHour: 22, endMinute: 0 },
    Night: { startHour: 22, startMinute: 0, endHour: 6, endMinute: 0 }
  };

  const config = shiftConfig[shiftType];
  
  // Create start time
  const startTime = new Date(date);
  startTime.setHours(config.startHour, config.startMinute, 0, 0);
  
  // Create end time
  const endTime = new Date(date);
  
  if (shiftType === "Night") {
    // Night shift ends next day at 6 AM
    endTime.setDate(endTime.getDate() + 1);
    endTime.setHours(config.endHour, config.endMinute, 0, 0);
  } else {
    endTime.setHours(config.endHour, config.endMinute, 0, 0);
  }
  
  return { startTime, endTime };
};

// ✅ Assign shift with date (Admin only)
router.post("/assign", auth, adminOnly, async (req, res) => {
  try {
    const { loomId, weaverId, shiftType, scheduledDate } = req.body;

    // Validate required fields
    if (!loomId || !weaverId || !shiftType || !scheduledDate) {
      return res.status(400).json({ 
        message: "Missing required fields: loomId, weaverId, shiftType, scheduledDate" 
      });
    }

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduled = new Date(scheduledDate);
    scheduled.setHours(0, 0, 0, 0);

    if (scheduled < today) {
      return res.status(400).json({ 
        message: "Cannot assign shifts for past dates" 
      });
    }

    // Check if this shift slot is already assigned
    const existingShift = await Shift.findOne({
      loomId,
      scheduledDate: scheduled,
      shiftType,
      completed: false
    });

    if (existingShift) {
      return res.status(400).json({ 
        message: `This ${shiftType} shift is already assigned for ${scheduledDate}` 
      });
    }

    // Calculate shift times based on scheduled date
    const { startTime, endTime } = calculateShiftTimes(shiftType, scheduledDate);

    // Create new shift
    const shift = await Shift.create({
      loomId,
      weaverId,
      shiftType,
      scheduledDate: scheduled,
      startTime,
      endTime,
      completed: false
    });

    // Populate for response
    const populatedShift = await Shift.findById(shift._id)
      .populate("loomId", "loomId")
      .populate("weaverId", "name email");

    res.status(201).json({
      message: "Shift assigned successfully",
      shift: {
        id: populatedShift._id,
        loomId: populatedShift.loomId.loomId,
        weaverName: populatedShift.weaverId.name,
        shiftType: populatedShift.shiftType,
        scheduledDate: populatedShift.scheduledDate,
        startTime: populatedShift.startTime,
        endTime: populatedShift.endTime
      }
    });
  } catch (error) {
    console.error("Error assigning shift:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Get active shifts for logged-in weaver (only for TODAY)
router.get("/my-active-shift", auth, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find shifts scheduled for today that haven't been completed
    const shifts = await Shift.find({
      weaverId: req.user.id,
      scheduledDate: { $gte: today, $lt: tomorrow },
      completed: false
    })
      .populate("loomId")
      .sort({ startTime: 1 });

    const validShifts = [];

    for (const shift of shifts) {
      // Check if loom exists
      if (!shift.loomId) {
        continue;
      }

      // ✅ Auto-complete shift if end time has passed
      if (now > new Date(shift.endTime)) {
        shift.completed = true;
        shift.actualEndTime = shift.endTime;
        await shift.save();

        // Stop the loom if running
        if (shift.loomId.status === "running") {
          shift.loomId.status = "stopped";
          shift.loomId.runningSince = null;
          await shift.loomId.save();
        }
        continue;
      }

      // ✅ Only show shift if it's time to start (within 30 minutes before shift)
      const thirtyMinutesBeforeStart = new Date(shift.startTime);
      thirtyMinutesBeforeStart.setMinutes(thirtyMinutesBeforeStart.getMinutes() - 30);

      if (now >= thirtyMinutesBeforeStart) {
        validShifts.push(shift);
      }
    }

    res.json(validShifts);
  } catch (error) {
    console.error("Error fetching active shifts:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ NEW: Get ALL upcoming shifts for weaver (not limited to 7 days)
router.get("/my-all-upcoming-shifts", auth, async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Get all future shifts (tomorrow onwards)
    const shifts = await Shift.find({
      weaverId: req.user.id,
      scheduledDate: { $gte: tomorrow },
      completed: false
    })
      .populate("loomId", "loomId")
      .sort({ scheduledDate: 1, startTime: 1 });

    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ KEEP: Get upcoming shifts for weaver (next 7 days) - for backward compatibility
router.get("/my-upcoming-shifts", auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const shifts = await Shift.find({
      weaverId: req.user.id,
      scheduledDate: { $gte: today, $lt: nextWeek },
      completed: false
    })
      .populate("loomId", "loomId")
      .sort({ scheduledDate: 1, startTime: 1 });

    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Get all shifts for a specific loom (Admin) - NO date range filter, returns ALL shifts
router.get("/loom/:loomId", auth, adminOnly, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all incomplete shifts from today onwards
    const shifts = await Shift.find({
      loomId: req.params.loomId,
      scheduledDate: { $gte: today },
      completed: false
    })
      .populate("weaverId", "name email")
      .sort({ scheduledDate: 1, startTime: 1 });

    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Background job to auto-complete expired shifts
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
      shift.completed = true;
      shift.actualEndTime = shift.endTime;
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

// ✅ Delete shift assignment (Admin)
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    // Don't allow deletion of shifts that have already started
    if (shift.actualStartTime) {
      return res.status(400).json({ 
        message: "Cannot delete a shift that has already started" 
      });
    }

    await shift.deleteOne();
    res.json({ message: "Shift assignment deleted successfully" });
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

    if (String(shift.weaverId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    shift.completed = true;
    shift.actualEndTime = new Date();
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