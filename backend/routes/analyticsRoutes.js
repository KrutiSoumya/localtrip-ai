const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getSummary,
  getTopDestinations,
  getLeadsByMonth,
  getRevenueStats,
  getAIUsageStats,
  getUrgentLeads,
} = require("../controllers/analyticsController");

// Protected analytics routes
router.get("/summary", authMiddleware, getSummary);
router.get("/destinations", authMiddleware, getTopDestinations);
router.get("/leads-over-time", authMiddleware, getLeadsByMonth);
router.get("/revenue", authMiddleware, getRevenueStats);
router.get("/ai-usage", authMiddleware, getAIUsageStats);
router.get("/urgent-leads", authMiddleware, getUrgentLeads);

module.exports = router;