const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema({
  loomId: { type: mongoose.Schema.Types.ObjectId, ref: "Loom" },
  weaverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  shiftType: { type: String, enum: ["Morning", "Evening", "Night"] },
  startTime: Date,
  endTime: Date,
  attendanceMarked: { type: Boolean, default: false },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Shift", shiftSchema);
