const cron = require("node-cron");
const SensorData = require("../models/SensorData");
const ShiftSummary = require("../models/ShiftSummary");
const Shift = require("../models/Shift");

cron.schedule("0 */8 * * *", async () => {
  console.log("Running 8-hour shift summary");

  const shifts = await Shift.find({ completed: true });

  for (let shift of shifts) {
    const data = await SensorData.find({
      loomId: shift.loomId,
      timestamp: { $gte: shift.startTime, $lte: shift.endTime }
    });

    const totalEnergy = data.reduce((a, b) => a + b.energy, 0);
    const totalProduction = data.reduce((a, b) => a + b.production, 0);

    await ShiftSummary.create({
      loomId: shift.loomId,
      weaverId: shift.weaverId,
      shiftType: shift.shiftType,
      totalEnergy,
      totalProduction,
      startTime: shift.startTime,
      endTime: shift.endTime
    });
  }
});
