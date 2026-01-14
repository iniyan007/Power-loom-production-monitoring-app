const express = require("express");
const Loom = require("../models/Loom");
const SensorData = require("../models/SensorData");
const { auth, adminOnly } = require("../middleware/auth");
const Shift = require("../models/Shift");

const router = express.Router();

// ✅ Helper to check if shift is currently active
const isShiftCurrentlyActive = (shift) => {
  const now = new Date();
  const startTime = new Date(shift.startTime);
  const endTime = new Date(shift.endTime);
  
  // Shift is active if current time is between start and end time
  return now >= startTime && now <= endTime;
};

// Get all looms (Admin)
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const looms = await Loom.find();
    
    const loomsWithData = await Promise.all(
      looms.map(async (loom) => {
        const latestSensor = await SensorData.findOne({ loomId: loom._id })
          .sort({ timestamp: -1 });
        
        // Get today's active shift for this loom
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const activeShift = await Shift.findOne({
          loomId: loom._id,
          scheduledDate: { $gte: today, $lt: tomorrow },
          completed: false
        }).populate("weaverId", "name email");

        let startTime = '-';
        let endTime = '-';
        let weaverName = '';
        let weaverId = null;
        let shiftType = null;
        
        if (activeShift) {
          const shiftTimes = {
            Morning: { start: '06:00 AM', end: '02:00 PM' },
            Evening: { start: '02:00 PM', end: '10:00 PM' },
            Night: { start: '10:00 PM', end: '06:00 AM' }
          };
          const times = shiftTimes[activeShift.shiftType];
          if (times) {
            startTime = times.start;
            endTime = times.end;
          }
          weaverName = activeShift.weaverId ? activeShift.weaverId.name : '';
          weaverId = activeShift.weaverId ? activeShift.weaverId._id : null;
          shiftType = activeShift.shiftType;
        }

        return {
          id: loom._id,
          loomId: loom.loomId,
          status: loom.status,
          isRunning: loom.status === "running",
          weaverName,
          weaverId,
          shiftType,
          length: latestSensor ? latestSensor.production : '-',
          power: latestSensor ? latestSensor.energy : '-',
          startTime,
          endTime,
          runningSince: loom.runningSince
        };
      })
    );

    res.json(loomsWithData);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create new loom (Admin)
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const { loomId } = req.body;

    const existingLoom = await Loom.findOne({ loomId });
    if (existingLoom) {
      return res.status(400).json({ message: "Loom ID already exists" });
    }

    const loom = new Loom({ loomId });
    await loom.save();

    res.status(201).json({
      id: loom._id,
      loomId: loom.loomId,
      status: loom.status,
      isRunning: false,
      weaverName: '',
      length: '-',
      startTime: '-',
      endTime: '-',
      power: '-',
      runningSince: null
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Unassign weaver (Admin) - This now just removes future shifts
router.put("/:id/unassign", auth, adminOnly, async (req, res) => {
  try {
    const loom = await Loom.findById(req.params.id);

    if (!loom) {
      return res.status(404).json({ message: "Loom not found" });
    }

    // Complete all future incomplete shifts for this loom
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Shift.deleteMany({
      loomId: loom._id,
      scheduledDate: { $gte: today },
      completed: false,
      actualStartTime: { $exists: false } // Only delete shifts that haven't started
    });

    // Stop loom if running
    if (loom.status === "running") {
      loom.status = "stopped";
      loom.runningSince = null;
      await loom.save();
    }

    res.json({ message: "Future shift assignments removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete loom (Admin)
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    const loom = await Loom.findByIdAndDelete(req.params.id);
    
    if (!loom) {
      return res.status(404).json({ message: "Loom not found" });
    }

    // Also delete all shifts for this loom
    await Shift.deleteMany({ loomId: loom._id });

    res.json({ message: "Loom deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get weavers list (Admin)
router.get("/weavers", auth, adminOnly, async (req, res) => {
  try {
    const User = require("../models/User");
    const weavers = await User.find({ role: "weaver" }).select("name email");
    
    res.json(weavers.map(w => ({
      id: w._id,
      name: w.name,
      email: w.email
    })));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Start loom - with date and time validation
router.post("/:id/start", auth, async (req, res) => {
  try {
    const loom = await Loom.findById(req.params.id);

    if (!loom) {
      return res.status(404).json({ message: "Loom not found" });
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ✅ Find active shift for TODAY
    const activeShift = await Shift.findOne({
      loomId: loom._id,
      weaverId: req.user.id,
      scheduledDate: { $gte: today, $lt: tomorrow },
      completed: false
    });

    if (!activeShift) {
      return res.status(403).json({ 
        message: "No active shift found for today. Please contact administrator." 
      });
    }

    // ✅ Check if current time is within shift time
    if (!isShiftCurrentlyActive(activeShift)) {
      const startTime = new Date(activeShift.startTime).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return res.status(403).json({ 
        message: `Your ${activeShift.shiftType} shift starts at ${startTime}. Please wait until then.` 
      });
    }

    // ✅ Start the loom
    loom.status = "running";
    loom.runningSince = new Date();
    await loom.save();

    // Mark actual start time if not already marked
    if (!activeShift.actualStartTime) {
      activeShift.actualStartTime = new Date();
      await activeShift.save();
    }

    res.json({
      id: loom._id,
      loomId: loom.loomId,
      status: loom.status,
      runningSince: loom.runningSince
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Stop loom
router.post("/:id/stop", auth, async (req, res) => {
  try {
    const loom = await Loom.findById(req.params.id);

    if (!loom) {
      return res.status(404).json({ message: "Loom not found" });
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find active shift
    const activeShift = await Shift.findOne({
      loomId: loom._id,
      weaverId: req.user.id,
      scheduledDate: { $gte: today, $lt: tomorrow },
      completed: false
    });

    if (!activeShift) {
      return res.status(403).json({ message: "No active shift found" });
    }

    loom.status = "stopped";
    loom.runningSince = null;
    await loom.save();

    res.json({
      id: loom._id,
      loomId: loom.loomId,
      status: loom.status,
      runningSince: null
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;