const express = require('express');
const router = express.Router();
const { createPreference } = require('../controllers/checkout.controller');
const { checkoutLimiter } = require('../middlewares/rateLimit');
const { validateCheckoutInput } = require('../middlewares/validateInput');

router.post('/', checkoutLimiter, validateCheckoutInput, createPreference);

module.exports = router;
