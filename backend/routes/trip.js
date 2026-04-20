const express = require('express');
const router = express.Router();
const { createTrip } = require('../controllers/tripController');


router.post('/generate', createTrip);

const authMiddleware = require('../middleware/authMiddleware');

router.post('/generate', authMiddleware, createTrip);

module.exports = router;