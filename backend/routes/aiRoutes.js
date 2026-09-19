const express = require("express");
const router = express.Router();

const { body } = require("express-validator");

const authMiddleware = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validation");

const {
    handleParseQuery,
    handleGenerateItinerary,
    handleAIFeedback,
    getAIFeedbackStats
} = require("../controllers/aiController");

// ============================================================
// PARSE QUERY
// ============================================================

router.post(
    "/parse-query",
    [
        body("message")
            .trim()
            .notEmpty()
            .withMessage("Message is required")
    ],
    validateRequest,
    handleParseQuery
);


// ============================================================
// GENERATE ITINERARY
// ============================================================

router.post(
    "/generate-itinerary",
    authMiddleware,
    [
        body("destination")
            .trim()
            .notEmpty()
            .withMessage("Destination is required"),

        body("duration_days")
            .isInt({ min: 1 })
            .withMessage("Duration must be at least 1 day"),

        body("budget_total")
            .isFloat({ min: 1 })
            .withMessage("Budget must be a positive number"),

        body("group_size")
            .optional()
            .isInt({ min: 1 })
            .withMessage("Group size must be at least 1"),

        body("interests")
            .optional()
            .isArray()
            .withMessage("Interests must be an array"),

        body("avoid")
            .optional()
            .isArray()
            .withMessage("Avoid must be an array")
    ],
    validateRequest,
    handleGenerateItinerary
);


// ============================================================
// AI FEEDBACK
// ============================================================

router.post(
    "/feedback",
    authMiddleware,
    [
        body("output_id")
            .isInt({ min: 1 })
            .withMessage("Output ID must be a valid positive integer"),

        body("action")
            .isIn(["accept", "edit", "reject"])
            .withMessage("Action must be accept, edit, or reject"),

        body("reason")
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage("Reason must be 500 characters or less")
    ],
    validateRequest,
    handleAIFeedback
);


// ============================================================
// AI FEEDBACK STATISTICS
// ============================================================

router.get(
    "/feedback/stats",
    authMiddleware,
    getAIFeedbackStats
);


module.exports = router;