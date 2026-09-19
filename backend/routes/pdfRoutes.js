const express = require("express");

const router = express.Router();

const { body } = require("express-validator");

const authMiddleware = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validation");

const {
    generateItineraryPDF,
    generateQuotationPDF,
    generateBookingConfirmationPDF,
} = require("../controllers/pdfController");


// ============================================================
// GENERATE ITINERARY PDF
// ============================================================

router.post(
    "/itinerary",
    authMiddleware,
    [
        body("itinerary_id")
            .isInt({ min: 1 })
            .withMessage("itinerary_id must be a valid positive integer")
    ],
    validateRequest,
    generateItineraryPDF
);


// ============================================================
// GENERATE QUOTATION PDF
// ============================================================

router.post(
    "/quotation",
    authMiddleware,
    [
        body("quotation_id")
            .isInt({ min: 1 })
            .withMessage("quotation_id must be a valid positive integer")
    ],
    validateRequest,
    generateQuotationPDF
);

// ============================================================
// BOOKING CONFIRMATION PDF
// ============================================================

router.get(
    "/booking-confirmation/:id",
    authMiddleware,
    generateBookingConfirmationPDF
);


module.exports = router;