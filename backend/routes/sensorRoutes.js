const router = require("express").Router();
const SensorData = require("../models/SensorData");
const Shift = require("../models/Shift");
const Loom = require("../models/Loom");
const { auth, adminOnly } = require("../middleware/auth");

// NodeMCU sends data here (keep existing endpoint)
router.post("/data", async (req, res) => {
  try {
    const { loomId, energy, production } = req.query;

    // Find loom by loomId field (string ID)
    const loom = await Loom.findOne({ loomId });

    if (!loom) {
      return res.status(404).json({ message: "Loom not found" });
    }

    await SensorData.create({
      loomId: loom._id,   // ✅ ObjectId
      energy: Number(energy),
      production: Number(production)
    });

    res.send("Sensor data stored");
  } catch (error) {
    res.status(500).json({
      message: "Error storing sensor data",
      error: error.message
    });
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
    if (loom.status !== 'running' || !loom.runningSince) {
      return res.json([]);
    }

    // Get sensor data from when the loom started running
    const sensorData = await SensorData.find({
      loomId: req.params.loomId,
      timestamp: { $gte: loom.runningSince }
    })
      .sort({ timestamp: 1 })
      .limit(200); // Increased limit for better visualization

    // Format data for charts
    const formattedData = sensorData.map(data => ({
      timestamp: data.timestamp,
      production: parseFloat((data.production || 0).toFixed(3)),
      energy: parseFloat((data.energy || 0).toFixed(3))
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching live sensor data:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Get latest sensor reading for a loom (for real-time dashboard)
router.get("/latest/:loomId", auth, async (req, res) => {
  try {
    const loom = await Loom.findById(req.params.loomId);
    
    if (!loom) {
      return res.status(404).json({ message: "Loom not found" });
    }

    if (loom.status !== 'running' || !loom.runningSince) {
      return res.json({ production: 0, energy: 0, timestamp: null });
    }

    // Get the most recent sensor reading for current session
    const latestReading = await SensorData.findOne({
      loomId: req.params.loomId,
      timestamp: { $gte: loom.runningSince }
    }).sort({ timestamp: -1 });

    if (!latestReading) {
      return res.json({ production: 0, energy: 0, timestamp: null });
    }

    res.json({
      production: parseFloat((latestReading.production || 0).toFixed(3)),
      energy: parseFloat((latestReading.energy || 0).toFixed(3)),
      timestamp: latestReading.timestamp
    });
  } catch (error) {
    console.error('Error fetching latest sensor data:', error);
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
          .sort({ timestamp: 1 });

        // Get the last reading to determine total production/energy for this shift
        const lastReading = sensorData.length > 0 
          ? sensorData[sensorData.length - 1] 
          : null;

        const totalProduction = lastReading ? lastReading.production : 0;
        const totalEnergy = lastReading ? lastReading.energy : 0;

        return {
          shiftId: shift._id,
          weaverName: shift.weaverId ? shift.weaverId.name : "Unknown",
          weaverId: shift.weaverId ? shift.weaverId._id : null,
          shiftType: shift.shiftType,
          startTime: shift.startTime,
          endTime: shift.endTime,
          totalProduction: parseFloat(totalProduction.toFixed(3)),
          totalEnergy: parseFloat(totalEnergy.toFixed(3)),
          sensorData: sensorData.map(data => ({
            timestamp: data.timestamp,
            production: parseFloat((data.production || 0).toFixed(3)),
            energy: parseFloat((data.energy || 0).toFixed(3))
          }))
        };
      })
    );

    res.json(historyData);
  } catch (error) {
    console.error('Error fetching historical data:', error);
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

    const sensorData = await SensorData.find(query).sort({ timestamp: 1 });

    // Get the latest reading for cumulative totals
    const latestReading = sensorData.length > 0 
      ? sensorData[sensorData.length - 1] 
      : null;

    const stats = {
      totalProduction: latestReading ? parseFloat(latestReading.production.toFixed(3)) : 0,
      totalEnergy: latestReading ? parseFloat(latestReading.energy.toFixed(3)) : 0,
      averageProduction: sensorData.length > 0 
        ? parseFloat((sensorData.reduce((sum, data) => sum + (data.production || 0), 0) / sensorData.length).toFixed(3))
        : 0,
      averageEnergy: sensorData.length > 0
        ? parseFloat((sensorData.reduce((sum, data) => sum + (data.energy || 0), 0) / sensorData.length).toFixed(3))
        : 0,
      dataPoints: sensorData.length,
      startTime: sensorData.length > 0 ? sensorData[0].timestamp : null,
      endTime: sensorData.length > 0 ? sensorData[sensorData.length - 1].timestamp : null
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Get all looms performance summary (Admin only)
router.get("/summary", auth, adminOnly, async (req, res) => {
  try {
    const looms = await Loom.find();
    
    const summary = await Promise.all(
      looms.map(async (loom) => {
        // Get latest sensor reading (cumulative totals)
        const latestReading = await SensorData.findOne({ 
          loomId: loom._id 
        }).sort({ timestamp: -1 });
        
        const totalProduction = latestReading ? latestReading.production : 0;
        const totalEnergy = latestReading ? latestReading.energy : 0;
        
        // Get completed shifts count
        const shiftsCount = await Shift.countDocuments({ 
          loomId: loom._id, 
          completed: true 
        });

        // Get current session data if running
        let currentSessionProduction = 0;
        let currentSessionEnergy = 0;
        
        if (loom.status === 'running' && loom.runningSince) {
          const currentReading = await SensorData.findOne({
            loomId: loom._id,
            timestamp: { $gte: loom.runningSince }
          }).sort({ timestamp: -1 });
          
          if (currentReading) {
            currentSessionProduction = currentReading.production;
            currentSessionEnergy = currentReading.energy;
          }
        }

        return {
          loomId: loom.loomId,
          totalProduction: parseFloat(totalProduction.toFixed(3)),
          totalEnergy: parseFloat(totalEnergy.toFixed(3)),
          currentSessionProduction: parseFloat(currentSessionProduction.toFixed(3)),
          currentSessionEnergy: parseFloat(currentSessionEnergy.toFixed(3)),
          shiftsCompleted: shiftsCount,
          status: loom.status,
          isRunning: loom.status === 'running',
          runningSince: loom.runningSince
        };
      })
    );

    res.json(summary);
  } catch (error) {
    console.error('Error fetching summary:', error);
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
    console.error('Error during cleanup:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;