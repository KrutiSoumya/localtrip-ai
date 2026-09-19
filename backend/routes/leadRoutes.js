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
    getPriorityLeads
} = require("../controllers/leadController");

const {
    generateFollowUpMessages
} = require("../services/followUpService");

router.use(authMiddleware);

/*
 * IMPORTANT:
 * /priority and /follow-up/:id must come before /:id
 */

router.get("/priority", getPriorityLeads);

// Generate all 3 follow-up drafts for a lead
router.get("/follow-up/:id", async (req, res) => {
    try {
        const userId = req.user.id;
        const id = Number(req.params.id);

        const prisma = require("../services/db");

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

        res.json({
            lead_id: lead.id,
            customer_name: lead.customer_name,
            messages,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error generating follow-up messages",
            error: error.message,
        });
    }
});

router.post(
    "/",
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
router.get("/", getLeads);
router.get("/:id", getLeadById);
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