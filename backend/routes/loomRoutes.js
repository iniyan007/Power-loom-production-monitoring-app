const express = require("express");
const Loom = require("../models/Loom");
const SensorData = require("../models/SensorData");
const { auth, adminOnly } = require("../middleware/auth");
const Shift = require("../models/Shift");

const router = express.Router();

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
          return {
          id: loom._id,
          loomId: loom.loomId,
          status: loom.status,
          weaverName: loom.currentWeaver ? loom.currentWeaver.name : '',
          weaverId: loom.currentWeaver ? loom.currentWeaver._id : null,
          shiftType: activeShift ? activeShift.shiftType : null,
          length: latestSensor ? latestSensor.production : '-',
          power: latestSensor ? latestSensor.energy : '-',
          startTime: '-',
          endTime: '-'
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

    // Check if loom already exists
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
      weaverName: '',
      length: '-',
      startTime: '-',
      endTime: '-',
      power: '-'
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
router.put("/:id/unassign", auth, async (req, res) => {
  const loom = await Loom.findById(req.params.id);

  if (!loom || !loom.currentWeaver) {
    return res.json({ message: "No active assignment" });
  }

  await Shift.findOneAndUpdate(
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

  loom.currentWeaver = null;
  await loom.save();

  res.json({ message: "Loom unassigned and shift ended" });
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

module.exports = router;