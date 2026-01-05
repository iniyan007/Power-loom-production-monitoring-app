const express = require("express");
const Loom = require("../models/Loom");
const SensorData = require("../models/SensorData");
const { auth, adminOnly } = require("../middleware/auth");
const Shift = require("../models/Shift");

const router = express.Router();

// ✅ Helper function to check if shift time is valid
const isShiftActive = (shiftType) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  const shifts = {
    Morning: { start: 6 * 60, end: 14 * 60 }, // 6:00 AM - 2:00 PM
    Evening: { start: 14 * 60, end: 22 * 60 }, // 2:00 PM - 10:00 PM
    Night: { start: 22 * 60, end: 24 * 60 + 6 * 60 } // 10:00 PM - 6:00 AM
  };

  const shift = shifts[shiftType];
  if (!shift) return false;

  // Handle night shift (crosses midnight)
  if (shiftType === "Night") {
    return currentTimeInMinutes >= shifts.Night.start || currentTimeInMinutes < 6 * 60;
  }

  return currentTimeInMinutes >= shift.start && currentTimeInMinutes < shift.end;
};

// Get all looms (Admin)
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const looms = await Loom.find().populate("currentWeaver", "name email");
    
    // Get latest sensor data for each loom
    const loomsWithData = await Promise.all(
      looms.map(async (loom) => {
        const latestSensor = await SensorData.findOne({ loomId: loom._id })
          .sort({ timestamp: -1 });
        const activeShift = await Shift.findOne({
          loomId: loom._id,
          completed: false
        });

        // ✅ Calculate shift times
        let startTime = '-';
        let endTime = '-';
        
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
        }

        return {
          id: loom._id,
          loomId: loom.loomId,
          status: loom.status,
          isRunning: loom.status === "running", // ✅ ADDED for UI
          weaverName: loom.currentWeaver ? loom.currentWeaver.name : '',
          weaverId: loom.currentWeaver ? loom.currentWeaver._id : null,
          shiftType: activeShift ? activeShift.shiftType : null,
          length: latestSensor ? latestSensor.production : '-',
          power: latestSensor ? latestSensor.energy : '-',
          startTime,
          endTime,
          runningSince: loom.runningSince // ✅ ADDED for timer tracking
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

// ✅ Unassign weaver and complete shift
router.put("/:id/unassign", auth, adminOnly, async (req, res) => {
  try {
    const loom = await Loom.findById(req.params.id);

    if (!loom || !loom.currentWeaver) {
      return res.json({ message: "No active assignment" });
    }

    // Complete all active shifts for this loom
    await Shift.updateMany(
      {
        loomId: loom._id,
        weaverId: loom.currentWeaver,
        completed: false
      },
      {
        completed: true,
        endTime: new Date()
      }
    );

    // Stop loom if running
    loom.status = "stopped";
    loom.runningSince = null;
    loom.currentWeaver = null;
    await loom.save();

    res.json({ message: "Loom unassigned and shift ended" });
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

    res.json({ message: "Loom deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Assign weaver to loom (Admin)
router.put("/:id/assign", auth, adminOnly, async (req, res) => {
  try {
    const { weaverId } = req.body;

    const loom = await Loom.findByIdAndUpdate(
      req.params.id,
      { currentWeaver: weaverId },
      { new: true }
    ).populate("currentWeaver", "name email");

    if (!loom) {
      return res.status(404).json({ message: "Loom not found" });
    }

    res.json({
      id: loom._id,
      loomId: loom.loomId,
      weaverName: loom.currentWeaver.name,
      weaverId: loom.currentWeaver._id
    });
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

// ✅ Start loom - with shift validation
router.post("/:id/start", auth, async (req, res) => {
  try {
    const loom = await Loom.findById(req.params.id);

    if (!loom) {
      return res.status(404).json({ message: "Loom not found" });
    }

    // ✅ Check if weaver is assigned to this loom
    if (req.user.role === "weaver" && String(loom.currentWeaver) !== String(req.user.id)) {
      return res.status(403).json({ message: "You are not assigned to this loom" });
    }

    // ✅ Get active shift for validation
    const activeShift = await Shift.findOne({
      loomId: loom._id,
      weaverId: req.user.id,
      completed: false
    });

    if (!activeShift) {
      return res.status(403).json({ message: "No active shift found" });
    }

    // ✅ Check if current time is within shift time
    if (!isShiftActive(activeShift.shiftType)) {
      return res.status(403).json({ 
        message: `You can only start during ${activeShift.shiftType} shift` 
      });
    }

    // Start the loom
    loom.status = "running";
    loom.runningSince = new Date();
    await loom.save();

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

    // ✅ Check if weaver is assigned to this loom
    if (req.user.role === "weaver" && String(loom.currentWeaver) !== String(req.user.id)) {
      return res.status(403).json({ message: "You are not assigned to this loom" });
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