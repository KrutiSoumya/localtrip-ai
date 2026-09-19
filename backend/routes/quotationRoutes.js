const express = require("express");
const router = express.Router();

const { body, param } = require("express-validator");

const authMiddleware = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validation");

const {
  createQuotation,
  getQuotationByLeadId,
} = require("../controllers/quotationController");


// All quotation routes require authentication
router.use(authMiddleware);


// Create quotation
router.post(
  "/",
  [
    body("itineraryId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("itineraryId must be a valid positive integer"),

    body("lead_id")
      .optional()
      .isInt({ min: 1 })
      .withMessage("lead_id must be a valid positive integer"),

    body("itinerary")
      .notEmpty()
      .withMessage("Itinerary is required"),

    body("itinerary.days")
      .isArray({ min: 1 })
      .withMessage("Itinerary must contain at least one day"),

    body("margin")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Margin must be a non-negative number"),

    body("group_size")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Group size must be at least 1"),

    body("currency")
      .optional()
      .trim()
      .isLength({ min: 3, max: 3 })
      .withMessage("Currency must be a 3-letter code"),

    body("notes")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Notes must be 1000 characters or less"),
  ],
  validateRequest,
  createQuotation
);


// Get quotations for a lead
router.get(
  "/lead/:leadId",
  [
    param("leadId")
      .isInt({ min: 1 })
      .withMessage("leadId must be a valid positive integer"),
  ],
  validateRequest,
  getQuotationByLeadId
);


module.exports = router;
