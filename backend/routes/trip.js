const express = require("express");

const router = express.Router();

const { body } = require("express-validator");
const validateRequest = require("../middleware/validation");
const authMiddleware = require("../middleware/authMiddleware");

const {
    createTrip
} = require("../controllers/tripController");

router.post(
    "/generate",
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
    createTrip
);

module.exports = router;