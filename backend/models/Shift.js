const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema({
  loomId: { type: mongoose.Schema.Types.ObjectId, ref: "Loom", required: true },
  weaverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  shiftType: { 
    type: String, 
    enum: ["Morning", "Evening", "Night"],
    required: true 
  },
  scheduledDate: { 
    type: Date, 
    required: true
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },

  attendanceMarked: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },

  actualStartTime: { type: Date },
  actualEndTime: { type: Date }

}, { timestamps: true });

/* ✅ INDEXES */

// ✅ Prevent duplicate loom-shift assignments
shiftSchema.index(
  { loomId: 1, scheduledDate: 1, shiftType: 1 },
  { unique: true }
);

// ✅ Query optimizations
shiftSchema.index({ weaverId: 1, scheduledDate: 1 });
shiftSchema.index({ completed: 1, endTime: 1 });

module.exports = mongoose.model("Shift", shiftSchema);
