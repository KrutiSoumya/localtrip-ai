const express = require("express");
const { body } = require("express-validator");
const validateRequest = require("../middleware/validation");
const router = express.Router();

const {
  login,
  register
} = require("../controllers/authController");

router.post(
    "/register",
    [
        body("email")
            .trim()
            .isEmail()
            .withMessage("A valid email is required"),

        body("password")
            .isLength({ min: 8 })
            .withMessage("Password must be at least 8 characters"),

        body("name")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Name cannot be empty")
    ],
    validateRequest,
    register
);
router.post(
    "/login",
    [
        body("email")
            .trim()
            .isEmail()
            .withMessage("A valid email is required"),

        body("password")
            .notEmpty()
            .withMessage("Password is required")
    ],
    validateRequest,
    login
);

module.exports = router;