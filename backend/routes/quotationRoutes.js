const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createQuotation,
  getQuotationByLeadId,
} = require("../controllers/quotationController");

router.post("/", authMiddleware, createQuotation);
router.get("/lead/:leadId", authMiddleware, getQuotationByLeadId);

module.exports = router;