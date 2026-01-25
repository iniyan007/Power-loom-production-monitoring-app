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
    required: true,
    index: true 
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  // Shift status
  attendanceMarked: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  // ✅ NEW: Actual times when shift started/ended
  actualStartTime: { type: Date },
  actualEndTime: { type: Date }
}, { timestamps: true });

// ✅ Index for efficient querying
shiftSchema.index({ loomId: 1, scheduledDate: 1, shiftType: 1 });
shiftSchema.index({ weaverId: 1, scheduledDate: 1 });
shiftSchema.index({ completed: 1, endTime: 1 });

// ✅ Prevent duplicate assignments
shiftSchema.index(
  { loomId: 1, scheduledDate: 1, shiftType: 1 },
  { unique: true }
);

module.exports = mongoose.model("Shift", shiftSchema);