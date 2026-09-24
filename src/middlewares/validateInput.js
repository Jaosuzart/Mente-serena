const { getPlan } = require('../config/plans');
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

/**
 * Remove tags HTML e caracteres de controle de uma string.
 * Previne XSS e injection em campos de texto.
 * @param {string} str
 * @returns {string}
 */
function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/<[^>]*>/g, '')
        .replace(/[^\x20-\x7E\u00C0-\u017E]/g, '')
        .trim();
}
function validateCheckoutInput(req, res, next) {
    const rawNome = req.body?.nome;
    const rawEmail = req.body?.email;

    const nome = sanitize(rawNome);
    const email = sanitize(rawEmail)?.toLowerCase();

    if (!nome || nome.length < 3 || nome.length > 100) {
        return res.status(422).json({
            error: 'Dados inválidos',
            message: 'O campo nome deve ter entre 3 e 100 caracteres.'
        });
    }

    if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
        return res.status(422).json({
            error: 'Dados inválidos',
            message: 'Por favor, informe um endereço de e-mail válido.'
        });
    }

    if (!getPlan(req.body?.plan)) {
        return res.status(422).json({ error: 'Dados inválidos', message: 'Selecione um plano válido.' });
    }
    if (req.body.cupom != null && (typeof req.body.cupom !== 'string' || req.body.cupom.length > 50)) {
        return res.status(422).json({ error: 'Dados inválidos', message: 'Cupom inválido.' });
    }

    req.body.nome = nome;
    req.body.email = email;

    next();
}

function validateEmailOnly(req, res, next) {
    const rawEmail = req.body?.email;
    const email = sanitize(rawEmail)?.toLowerCase();

    if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
        return res.status(422).json({
            error: 'Dados inválidos',
            message: 'Por favor, informe um endereço de e-mail válido.'
        });
    }

    req.body.email = email;
    next();
}

module.exports = { validateCheckoutInput, validateEmailOnly };
