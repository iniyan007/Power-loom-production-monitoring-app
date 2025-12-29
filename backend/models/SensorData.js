const mongoose = require("mongoose");

const sensorSchema = new mongoose.Schema({
  loomId: { type: mongoose.Schema.Types.ObjectId, ref: "Loom" },
  energy: Number,       // kWh
  production: Number,   // meters / units
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SensorData", sensorSchema);
