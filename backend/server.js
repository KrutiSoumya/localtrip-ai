const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

require("dotenv").config();

const configRoutes = require("./routes/configRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());


// Routes
const leadRoutes = require("./routes/leadRoutes");
const authRoutes = require("./routes/auth");
const tripRoutes = require("./routes/trip");
const aiRoutes = require("./routes/aiRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const pdfRoutes = require("./routes/pdfRoutes");
const quotationRoutes = require("./routes/quotationRoutes");


// API routes
app.use("/api/config", configRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/trip", tripRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/quotations", quotationRoutes);


// Test route
app.get("/", (req, res) => {
    res.send("API is running...");
});


// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
