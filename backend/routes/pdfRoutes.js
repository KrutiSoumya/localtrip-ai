const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  generateItineraryPDF,
  generateQuotationPDF,
  generateBookingConfirmationPDF,
} = require("../controllers/pdfController");

router.post("/itinerary", authMiddleware, generateItineraryPDF);
router.post("/quotation", authMiddleware, generateQuotationPDF);
router.get(
  "/booking-confirmation/:id",
  authMiddleware,
  generateBookingConfirmationPDF
);

module.exports = router;