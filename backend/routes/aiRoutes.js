const express = require('express');
const router = express.Router();
const { handleParseQuery } = require('../controllers/aiController');

router.post('/parse-query', handleParseQuery);

module.exports = router;