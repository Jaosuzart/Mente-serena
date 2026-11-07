
const rateLimit = require('express-rate-limit');
const checkoutLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Muitas tentativas',
        message: 'Você realizou muitas tentativas. Aguarde 15 minutos antes de tentar novamente.'
    },
    handler: (req, res, next, options) => {
        console.warn(`[RATE LIMIT] Bloqueio de checkout — IP: ${req.ip} — ${new Date().toISOString()}`);
        res.status(429).json(options.message);
    }
});
const vagaGratisLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Limite de tentativas atingido',
        message: 'Você atingiu o limite de tentativas de vaga gratuita por hora.'
    },
    handler: (req, res, next, options) => {
        console.warn(`[RATE LIMIT] Bloqueio de vaga grátis — IP: ${req.ip} — ${new Date().toISOString()}`);
        res.status(429).json(options.message);
    }
});

module.exports = { checkoutLimiter, vagaGratisLimiter };
