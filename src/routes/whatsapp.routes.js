const express = require('express');
const router = express.Router();
const { getConnectionState } = require('../services/whatsapp');
const ResponseHelper = require('../helpers/response.helper');

<<<<<<< HEAD
function requireAdminAuth(req, res, next) {
    const adminToken = process.env.ADMIN_TOKEN || process.env.WHATSAPP_ADMIN_TOKEN;
    if (adminToken) {
        const token = req.headers['x-admin-token'] || req.query.token;
        if (!token || token !== adminToken) {
            return ResponseHelper.error(res, 'Não autorizado: token de administrador inválido ou ausente.', 401);
        }
    }
    next();
}

router.use(requireAdminAuth);

=======
>>>>>>> 172885066c8ae2a0cc1e61506b18a25e7d0fa1e8
router.get('/status', (req, res) => {
    try {
        const state = getConnectionState();
        return ResponseHelper.success(res, state, 'Status da conexão recuperado');
    } catch (error) {
        return ResponseHelper.error(res, 'Erro ao consultar status da conexão', 500, error);
    }
});

router.get('/qr-redirect', (req, res) => {
    try {
        const state = getConnectionState();
        if (state.qr) {
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
