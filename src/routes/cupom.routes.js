const express = require('express');
const router = express.Router();

const { validarCupom } = require('../frontend/assets/filters/couponFilters');
const { validateEmailOnly } = require('../middlewares/validateInput');
const { checkoutLimiter } = require('../middlewares/rateLimit');
router.post('/', checkoutLimiter, validateEmailOnly, async (req, res) => {
    try {
        const { email, cupom } = req.body;

        if (!cupom || typeof cupom !== 'string') {
            return res.status(400).json({ valido: false, mensagem: 'Código de cupom não informado.' });
        }

        const resultado = await validarCupom(email, cupom);

        return res.status(resultado.valido ? 200 : 422).json({
            valido: resultado.valido,
            cupom: cupom.trim().toUpperCase(),
            desconto: resultado.desconto,
            mensagem: resultado.mensagem,
        });

    } catch (error) {
        console.error('[CupomRoute] Erro ao validar cupom:', error);
        return res.status(500).json({ valido: false, mensagem: 'Erro ao verificar o cupom.' });
    }
});

module.exports = router;
