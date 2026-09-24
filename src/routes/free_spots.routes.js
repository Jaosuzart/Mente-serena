const express = require('express');
const router = express.Router();
const freeSpotsController = require('../controllers/free_spots.controller');

const { validateEmailOnly } = require('../middlewares/validateInput');
const { checkoutLimiter } = require('../middlewares/rateLimit');

router.post('/', checkoutLimiter, validateEmailOnly, freeSpotsController.claimFreeSpot);

module.exports = router;
