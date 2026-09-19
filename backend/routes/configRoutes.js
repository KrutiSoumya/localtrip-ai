const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  saveAgentConfig,
  getDestinations,
  addDestination,
  deleteDestination,
} = require("../controllers/configController");

router.post("/agent", authMiddleware, saveAgentConfig);
router.get("/destinations", authMiddleware, getDestinations);
router.post("/destinations", authMiddleware, addDestination);
router.delete("/destinations/:name", authMiddleware, deleteDestination);

module.exports = router;