
const express = require("express");
const router = express.Router();

const { body, param } = require("express-validator");

const authMiddleware = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validation");

const {
  createBooking,
  getAllBookings,
  getUpcomingBookings,
  updateBookingStatus,
} = require("../controllers/bookingController");

// Get all bookings
router.get("/", authMiddleware, getAllBookings);

// Create a confirmed booking
router.post(
  "/",
  authMiddleware,
  [
    body("leadId")
      .isInt({ min: 1 })
      .withMessage("Lead ID must be a valid positive integer"),

    body("itineraryId")
      .isInt({ min: 1 })
      .withMessage("Itinerary ID must be a valid positive integer"),
  ],
  validateRequest,
  createBooking
);

// Get upcoming bookings
router.get("/upcoming", authMiddleware, getUpcomingBookings);

// Update booking lifecycle status (payment status is invoice-managed).
router.patch(
  "/:id/status",
  authMiddleware,
  [param("id").isInt({ min: 1 }), body("status").trim().isIn(["Confirmed", "Cancelled"])],
  validateRequest,
  updateBookingStatus
);

module.exports = router;
