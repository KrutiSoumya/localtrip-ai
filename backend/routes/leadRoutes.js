const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createLead,
  getAllLeads,
  getLeadById,
  updateLeadStatus,
  deleteLead,
} = require("../controllers/leadController");

router.post("/", authMiddleware, createLead);
router.get("/", authMiddleware, getAllLeads);
router.get("/:id", authMiddleware, getLeadById);
router.patch("/:id/status", authMiddleware, updateLeadStatus);
router.delete("/:id", authMiddleware, deleteLead);

module.exports = router;