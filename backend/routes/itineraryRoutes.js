
const express = require("express");
const { body, validationResult } = require("express-validator");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  saveItinerary,
  updateItinerary,
  getItineraryById,
  getItineraryByLeadId,
  updateItineraryDay,
} = require("../controllers/itineraryController");

// Validate request body for lead ID
const validateLeadId = [
  body("leadId")
    .isInt({ min: 1 })
    .withMessage("A valid numeric leadId is required"),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    next();
  },
];

// Create a new itinerary
// POST /api/itinerary/save
router.post(
  "/save",
  authMiddleware,
  validateLeadId,
  saveItinerary
);

// Get itineraries belonging to a lead
// GET /api/itinerary/lead/:leadId
router.get(
  "/lead/:leadId",
  authMiddleware,
  getItineraryByLeadId
);

// Update one itinerary day
// PATCH /api/itinerary/day/:dayId
router.patch(
  "/day/:dayId",
  authMiddleware,
  updateItineraryDay
);

// Get one saved itinerary by its ID
// GET /api/itinerary/:id
router.get(
  "/:id",
  authMiddleware,
  getItineraryById
);

// Update an existing itinerary
// PATCH /api/itinerary/:id
router.patch(
  "/:id",
  authMiddleware,
  updateItinerary
);

module.exports = router;
