const express = require('express');
const router = express.Router();
const freeSpotsController = require('../controllers/free_spots.controller');

const { validateEmailOnly } = require('../middlewares/validateInput');
<<<<<<< HEAD
const { vagaGratisLimiter } = require('../middlewares/rateLimit');

router.post('/', vagaGratisLimiter, validateEmailOnly, freeSpotsController.claimFreeSpot);
=======
const { checkoutLimiter } = require('../middlewares/rateLimit');

router.post('/', checkoutLimiter, validateEmailOnly, freeSpotsController.claimFreeSpot);
>>>>>>> 172885066c8ae2a0cc1e61506b18a25e7d0fa1e8

module.exports = router;
