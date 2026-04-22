const express = require('express');
const router = express.Router();

const {
    handleParseQuery,
    handleGenerateItinerary
} = require('../controllers/aiController');

router.post('/parse-query', handleParseQuery);
router.post('/generate-itinerary', handleGenerateItinerary);

module.exports = router;