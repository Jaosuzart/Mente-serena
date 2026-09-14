const express = require('express');
const router = express.Router();
const freeSpotsController = require('../controllers/free_spots.controller');

router.post('/', freeSpotsController.claimFreeSpot);

module.exports = router;
