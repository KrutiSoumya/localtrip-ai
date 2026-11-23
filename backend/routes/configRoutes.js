const express = require("express");
const { body } = require("express-validator");
const validateRequest = require("../middleware/validation");
const authMiddleware = require("../middleware/authMiddleware");
const {
  saveAgentConfig, getDestinations, addDestination, updateDestinationStatus, deleteDestination,
  getAgentPaymentConfig, saveAgentPaymentConfig,
} = require("../controllers/configController");
const router = express.Router();
router.get("/agent/payment", authMiddleware, getAgentPaymentConfig);
router.put("/agent/payment", authMiddleware, [body("upi_id").trim().isLength({ max: 120 }).withMessage("UPI ID must be 120 characters or less")], validateRequest, saveAgentPaymentConfig);
router.post("/agent", authMiddleware, saveAgentConfig);
router.get("/destinations", authMiddleware, getDestinations);
router.post("/destinations", authMiddleware, addDestination);
router.patch("/destinations/:name/status", authMiddleware, updateDestinationStatus);
router.delete("/destinations/:name", authMiddleware, deleteDestination);
module.exports = router;
