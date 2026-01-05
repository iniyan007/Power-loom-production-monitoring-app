const mongoose = require("mongoose");

const loomSchema = new mongoose.Schema({
  loomId: { type: String, required: true, unique: true },
  status: { type: String, default: "stopped", enum: ["running", "stopped"] },
  currentWeaver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  runningSince: { type: Date, default: null } // ✅ ADDED - Track when loom started
}, { timestamps: true });

module.exports = mongoose.model("Loom", loomSchema);