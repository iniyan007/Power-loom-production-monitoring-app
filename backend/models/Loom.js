const mongoose = require("mongoose");

const loomSchema = new mongoose.Schema({
  loomId: { type: String, required: true, unique: true },
  status: { type: String, default: "stopped" },
  currentWeaver: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

module.exports = mongoose.model("Loom", loomSchema);
