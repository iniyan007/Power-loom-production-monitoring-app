const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const loomRoutes = require("./routes/loomRoutes");
const shiftRoutes = require("./routes/shiftRoutes");
const sensorRoutes = require("./routes/sensorRoutes");

require("./cron/shiftSummary");

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/looms", loomRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/sensor", sensorRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));
