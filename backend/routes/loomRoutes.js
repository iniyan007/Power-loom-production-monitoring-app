const express = require("express");
const Loom = require("../models/Loom");
const SensorData = require("../models/SensorData");
const { auth, adminOnly } = require("../middleware/auth");

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
        
        return {
          id: loom._id,
          loomId: loom.loomId,
          status: loom.status,
          weaverName: loom.currentWeaver ? loom.currentWeaver.name : '',
          weaverId: loom.currentWeaver ? loom.currentWeaver._id : null,
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