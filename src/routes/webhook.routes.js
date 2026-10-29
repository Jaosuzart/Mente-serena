const express = require('express');
const router = express.Router();
const { processWebhook } = require('../controllers/webhook.controller');
const { verifyMercadoPagoWebhook } = require('../middlewares/verifyWebhook');

router.post('/', verifyMercadoPagoWebhook, processWebhook);

module.exports = router;
