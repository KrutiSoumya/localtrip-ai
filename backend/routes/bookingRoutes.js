const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createBooking,
  getUpcomingBookings,
  updatePaymentStatus,
} = require("../controllers/bookingController");

router.post("/", authMiddleware, createBooking);
router.get("/upcoming", getUpcomingBookings);
router.patch("/:id/payment", authMiddleware, updatePaymentStatus);

module.exports = router;