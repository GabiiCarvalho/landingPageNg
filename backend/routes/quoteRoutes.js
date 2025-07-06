const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');

router.post('/quote', quoteController.submitQuoteRequest);

module.exports = router;