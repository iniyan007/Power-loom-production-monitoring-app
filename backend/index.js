const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoutes");
const loomRoutes = require("./routes/loomRoutes");
const shiftRoutes = require("./routes/shiftRoutes");
const sensorRoutes = require("./routes/sensorRoutes");

dotenv.config();

const app = express();

// Middleware - ORDER IS CRITICAL
app.use(cors({
  origin: "https://power-loom-production-monitoring-ap.vercel.app",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to Database
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/looms", loomRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/sensor", sensorRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Weaving Management API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: "Something went wrong!", 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
// Add this temporarily to fix the database
app.get("/api/fix-db", async (req, res) => {
  try {
    const User = require("./models/User");
    await User.collection.dropIndex("username_1");
    res.json({ message: "Index dropped successfully" });
  } catch (error) {
    res.json({ message: "Error or index doesn't exist", error: error.message });
  }
});
// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});