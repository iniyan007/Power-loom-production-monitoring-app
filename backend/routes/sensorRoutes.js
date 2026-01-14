const router = require("express").Router();
const SensorData = require("../models/SensorData");
const Shift = require("../models/Shift");
const Loom = require("../models/Loom");
const { auth, adminOnly } = require("../middleware/auth");

// NodeMCU sends data here (keep existing endpoint)
router.post("/data", async (req, res) => {
  try {
    await SensorData.create(req.body);
    res.send("Sensor data stored");
  } catch (error) {
    res.status(500).json({ message: "Error storing sensor data", error: error.message });
  }
});

// ✅ Get live sensor data for a specific loom (current running session)
router.get("/live/:loomId", auth, async (req, res) => {
  try {
    const loom = await Loom.findById(req.params.loomId);
    
    if (!loom) {
      return res.status(404).json({ message: "Loom not found" });
    }

    // If loom is not running or no runningSince, return empty array
    if (!loom.runningSince) {
      return res.json([]);
    }

    // Get sensor data from when the loom started running
    const sensorData = await SensorData.find({
      loomId: req.params.loomId,
      timestamp: { $gte: loom.runningSince }
    })
      .sort({ timestamp: 1 })
      .limit(100); // Limit to last 100 readings for performance

    // Format data for charts
    const formattedData = sensorData.map(data => ({
      timestamp: data.timestamp,
      production: data.production || 0,
      energy: data.energy || 0
    }));

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Get historical data for a specific loom (past shifts)
router.get("/history/:loomId", auth, async (req, res) => {
  try {
    // Get all completed shifts for this loom
    const completedShifts = await Shift.find({
      loomId: req.params.loomId,
      completed: true
    })
      .populate("weaverId", "name email")
      .sort({ endTime: -1 })
      .limit(10); // Last 10 shifts

    const historyData = await Promise.all(
      completedShifts.map(async (shift) => {
        // Get sensor data for this shift period
        const sensorData = await SensorData.find({
          loomId: req.params.loomId,
          timestamp: {
            $gte: shift.startTime,
            $lte: shift.endTime
          }
        })
          .sort({ timestamp: 1 })
          .limit(50); // Limit for performance

        // Calculate totals
        const totalProduction = sensorData.reduce((sum, data) => sum + (data.production || 0), 0);
        const totalEnergy = sensorData.reduce((sum, data) => sum + (data.energy || 0), 0);

        return {
          shiftId: shift._id,
          weaverName: shift.weaverId ? shift.weaverId.name : "Unknown",
          weaverId: shift.weaverId ? shift.weaverId._id : null,
          shiftType: shift.shiftType,
          startTime: shift.startTime,
          endTime: shift.endTime,
          totalProduction,
          totalEnergy,
          sensorData: sensorData.map(data => ({
            timestamp: data.timestamp,
            production: data.production || 0,
            energy: data.energy || 0
          }))
        };
      })
    );

    res.json(historyData);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Get aggregated statistics for a loom
router.get("/stats/:loomId", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {
      loomId: req.params.loomId
    };

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sensorData = await SensorData.find(query);

    const stats = {
      totalProduction: sensorData.reduce((sum, data) => sum + (data.production || 0), 0),
      totalEnergy: sensorData.reduce((sum, data) => sum + (data.energy || 0), 0),
      averageProduction: sensorData.length > 0 
        ? sensorData.reduce((sum, data) => sum + (data.production || 0), 0) / sensorData.length 
        : 0,
      averageEnergy: sensorData.length > 0
        ? sensorData.reduce((sum, data) => sum + (data.energy || 0), 0) / sensorData.length
        : 0,
      dataPoints: sensorData.length
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Get all looms performance summary (Admin only)
router.get("/summary", auth, adminOnly, async (req, res) => {
  try {
    const looms = await Loom.find();
    
    const summary = await Promise.all(
      looms.map(async (loom) => {
        // Get total production and energy for this loom
        const sensorData = await SensorData.find({ loomId: loom._id });
        
        const totalProduction = sensorData.reduce((sum, data) => sum + (data.production || 0), 0);
        const totalEnergy = sensorData.reduce((sum, data) => sum + (data.energy || 0), 0);
        
        // Get completed shifts count
        const shiftsCount = await Shift.countDocuments({ 
          loomId: loom._id, 
          completed: true 
        });

        return {
          loomId: loom.loomId,
          totalProduction,
          totalEnergy,
          shiftsCompleted: shiftsCount,
          status: loom.status
        };
      })
    );

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Delete old sensor data (cleanup endpoint - Admin only)
router.delete("/cleanup", auth, adminOnly, async (req, res) => {
  try {
    const { daysOld = 90 } = req.query;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));

    const result = await SensorData.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    res.json({ 
      message: `Deleted sensor data older than ${daysOld} days`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;