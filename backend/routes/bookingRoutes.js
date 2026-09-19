const express = require("express");
const router = express.Router();

const { body, param } = require("express-validator");

const authMiddleware = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validation");

const {
    createBooking,
    getUpcomingBookings,
    updatePaymentStatus,
} = require("../controllers/bookingController");


// ============================================================
// CREATE BOOKING
// ============================================================

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

        body("quotationId")
            .isInt({ min: 1 })
            .withMessage("Quotation ID must be a valid positive integer")
    ],
    validateRequest,
    createBooking
);


// ============================================================
// GET UPCOMING BOOKINGS
// ============================================================

router.get(
    "/upcoming",
    authMiddleware,
    getUpcomingBookings
);


// ============================================================
// UPDATE PAYMENT STATUS
// ============================================================

router.patch(
    "/:id/payment",
    authMiddleware,
    [
        param("id")
            .isInt({ min: 1 })
            .withMessage("Booking ID must be a valid positive integer"),

body("paymentStatus")
    .trim()
    .isIn(["Pending", "Paid", "Partial", "Failed"])
    .withMessage(
        "Payment status must be Pending, Paid, Partial, or Failed"
    )
    ],
    validateRequest,
    updatePaymentStatus
);


module.exports = router;