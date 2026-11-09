const express = require('express');
const router = express.Router();
const freeSpotsController = require('../controllers/free_spots.controller');

const { validateEmailOnly } = require('../middlewares/validateInput');
const { vagaGratisLimiter } = require('../middlewares/rateLimit');

router.post('/', vagaGratisLimiter, validateEmailOnly, freeSpotsController.claimFreeSpot);

module.exports = router;
