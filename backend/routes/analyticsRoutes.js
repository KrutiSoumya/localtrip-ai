
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getAnalytics,
  getSummary,
  getTopDestinations,
  getLeadsByMonth,
  getRevenueStats,
  getAIUsageStats,
  getUrgentLeads,
} = require("../controllers/analyticsController");

// Combined analytics endpoint used by the frontend
// GET /api/analytics
router.get("/", authMiddleware, getAnalytics);

// Individual analytics endpoints
// GET /api/analytics/summary
router.get("/summary", authMiddleware, getSummary);

// GET /api/analytics/destinations
router.get("/destinations", authMiddleware, getTopDestinations);

// GET /api/analytics/leads-over-time
router.get("/leads-over-time", authMiddleware, getLeadsByMonth);

// GET /api/analytics/revenue
router.get("/revenue", authMiddleware, getRevenueStats);

// GET /api/analytics/ai-usage
router.get("/ai-usage", authMiddleware, getAIUsageStats);

// GET /api/analytics/urgent-leads
router.get("/urgent-leads", authMiddleware, getUrgentLeads);

module.exports = router;
