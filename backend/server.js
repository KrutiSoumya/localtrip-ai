const express = require("express");
const cors = require("cors");
const configRoutes = require("./routes/configRoutes");
const helmet = require("helmet"); // ✅ ADDED
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use("/api/config", configRoutes);
app.use(helmet()); // ✅ ADDED (security headers)

// Routes
const leadRoutes = require("./routes/leadRoutes");
const authRoutes = require("./routes/auth");
const tripRoutes = require("./routes/trip");
const aiRoutes = require("./routes/aiRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const pdfRoutes = require("./routes/pdfRoutes");

app.use("/api/leads", leadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/trip", tripRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/pdf", pdfRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});