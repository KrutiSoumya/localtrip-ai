const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  saveItinerary,
  getItineraryByLeadId,
  updateItineraryDay,
} = require("../controllers/itineraryController");

router.post("/", authMiddleware, saveItinerary);
router.get("/lead/:leadId", authMiddleware, getItineraryByLeadId);
router.patch("/day/:dayId", authMiddleware, updateItineraryDay);

module.exports = router;