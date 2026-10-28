const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  saveItinerary,
  updateItinerary,
  getItineraryByLeadId,
  updateItineraryDay,
} = require("../controllers/itineraryController");

// Create itinerary
router.post("/", authMiddleware, saveItinerary);

// Update an existing itinerary
router.patch("/:id", authMiddleware, updateItinerary);

// Get itineraries belonging to a lead
router.get("/lead/:leadId", authMiddleware, getItineraryByLeadId);

// Update one itinerary day
router.patch("/day/:dayId", authMiddleware, updateItineraryDay);

module.exports = router;