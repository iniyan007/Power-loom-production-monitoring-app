const mongoose = require("mongoose");

const shiftSummarySchema = new mongoose.Schema({
  loomId: { type: mongoose.Schema.Types.ObjectId, ref: "Loom" },
  weaverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  shiftType: String,
  totalEnergy: Number,
  totalProduction: Number,
  startTime: Date,
  endTime: Date
}, { timestamps: true });

module.exports = mongoose.model("ShiftSummary", shiftSummarySchema);
