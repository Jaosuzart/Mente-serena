const express = require('express');
const router = express.Router();
const { getConnectionState } = require('../services/whatsapp');
const ResponseHelper = require('../helpers/response.helper');

// Rota para consultar o status atual da conexão e obter o QR Code
router.get('/status', (req, res) => {
    try {
        const state = getConnectionState();
        return ResponseHelper.success(res, state, 'Status da conexão recuperado');
    } catch (error) {
        return ResponseHelper.error(res, 'Erro ao consultar status da conexão', 500, error);
    }
});

// API Externa: Redireciona para o link do WhatsApp com os dados do QR Code
router.get('/qr-redirect', (req, res) => {
    try {
        const state = getConnectionState();
        if (state.qr) {
            // O número vem de forma segura do .env, sem expor hardcoded no código
            const phoneNumber = process.env.WHATSAPP_NUMBER || '';
            const whatsappApiUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(state.qr)}`;
            return res.redirect(whatsappApiUrl);
        } else {
            return res.status(400).send("QR Code não está disponível ou o WhatsApp já está conectado.");
        }
    } catch (error) {
        return ResponseHelper.error(res, 'Erro interno', 500, error);
    }
});

module.exports = router;
