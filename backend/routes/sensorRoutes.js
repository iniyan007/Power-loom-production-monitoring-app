const router = require("express").Router();
const SensorData = require("../models/SensorData");

// NodeMCU sends data here
router.post("/data", async (req, res) => {
  await SensorData.create(req.body);
  res.send("Sensor data stored");
});

module.exports = router;
