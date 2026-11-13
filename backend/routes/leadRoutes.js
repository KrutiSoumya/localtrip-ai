
const express = require("express");
const { body, param } = require("express-validator");
const validateRequest = require("../middleware/validation");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    createLead,
    getLeads,
    getLeadById,
    updateLeadStatus,
    getPriorityLeads,
    deleteLead
} = require("../controllers/leadController");

const {
    generateFollowUpMessages
} = require("../services/followUpService");

const prisma = require("../services/db");

// Authentication applies to all lead routes
router.use(authMiddleware);

/*
 * IMPORTANT:
 * /priority and /follow-up/:id must come before /:id
 */

// Get priority leads
router.get("/priority", getPriorityLeads);

// Generate all 3 follow-up drafts for a lead
router.get("/follow-up/:id", async (req, res) => {
    try {
        const userId = req.user.id;
        const id = Number(req.params.id);

        const lead = await prisma.lead.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!lead) {
            return res.status(404).json({
                message: "Lead not found",
            });
        }

        const messages = generateFollowUpMessages(lead);

        return res.json({
            lead_id: lead.id,
            customer_name: lead.customer_name,
            messages,
        });
    } catch (error) {
        console.error("Follow-up generation error:", error);

        return res.status(500).json({
            message: "Error generating follow-up messages",
            error: error.message,
        });
    }
});

// Create a new lead
router.post(
    "/",
    (req, res, next) => {
        console.log("POST /api/leads ROUTE HIT");
        console.log("Request body:", req.body);
        console.log("Authenticated user:", req.user?.id);
        next();
    },
    [
        body("customer_name")
            .trim()
            .notEmpty()
            .withMessage("Customer name is required"),

        body("phone")
            .trim()
            .notEmpty()
            .withMessage("Phone number is required"),

        body("email")
            .optional()
            .isEmail()
            .withMessage("Email must be valid"),

        body("destination")
            .trim()
            .notEmpty()
            .withMessage("Destination is required"),

        body("budget")
            .optional()
            .isFloat({ min: 0 })
            .withMessage("Budget must be a valid non-negative number"),

        body("duration")
            .optional()
            .isInt({ min: 1 })
            .withMessage("Duration must be at least 1 day")
    ],
    validateRequest,
    createLead
);

// Get all leads
router.get("/", getLeads);

// Delete a lead
router.delete(
    "/:id",
    [
        param("id")
            .isInt({ min: 1 })
            .withMessage("Lead ID must be a valid positive integer")
    ],
    validateRequest,
    deleteLead
);

// Get a specific lead
router.get("/:id", getLeadById);

// Update lead status
router.patch(
    "/:id/status",
    [
        param("id")
            .isInt({ min: 1 })
            .withMessage("Lead ID must be a valid positive integer"),

        body("status")
            .trim()
            .isIn([
                "New",
                "Contacted",
                "Quoted",
                "Confirmed",
                "Cancelled",
                "Inactive"
            ])
            .withMessage(
                "Status must be New, Contacted, Quoted, Confirmed, Cancelled, or Inactive"
            )
    ],
    validateRequest,
    updateLeadStatus
);

module.exports = router;
