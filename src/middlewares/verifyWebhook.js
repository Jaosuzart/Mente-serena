const crypto = require('crypto');
function safeCompare(a, b) {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');

    if (bufA.length !== bufB.length) return false;

    return crypto.timingSafeEqual(bufA, bufB);
}
function verifyMercadoPagoWebhook(req, res, next) {
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('[WEBHOOK] MP_WEBHOOK_SECRET não configurado no .env. Bloqueando por segurança.');
        return res.status(500).json({ error: 'Configuração de segurança incompleta.' });
    }

    const signatureHeader = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];

    if (!signatureHeader) {
        console.warn(`[WEBHOOK] Notificação sem assinatura recebida — IP: ${req.ip}`);
        return res.status(401).json({ error: 'Webhook não autorizado: assinatura ausente.' });
    }

    const parts = {};
    signatureHeader.split(',').forEach(part => {
        const [key, value] = part.split('=');
        if (key && value) parts[key.trim()] = value.trim();
    });

    const { ts, v1: receivedHash } = parts;

    if (!ts || !receivedHash) {
        console.warn(`[WEBHOOK] Header x-signature malformado — IP: ${req.ip}`);
        return res.status(401).json({ error: 'Webhook não autorizado: assinatura malformada.' });
    }

    const now = Math.floor(Date.now() / 1000);
    const tsNumber = parseInt(ts, 10);
    const MAX_AGE_SEC = 300; 
    if (isNaN(tsNumber) || Math.abs(now - tsNumber) > MAX_AGE_SEC) {
        console.warn(`[WEBHOOK] Timestamp expirado (possível replay attack) — IP: ${req.ip}`);
        return res.status(401).json({ error: 'Webhook não autorizado: timestamp expirado.' });
    }

    const dataId = req.query['data.id'] || req.query.id || req.body?.data?.id || '';
    const manifest = `id:${dataId};request-id:${requestId || ''};ts:${ts};`;

    const expectedHash = crypto
        .createHmac('sha256', webhookSecret)
        .update(manifest)
        .digest('hex');

    if (!safeCompare(expectedHash, receivedHash)) {
        console.warn(`[WEBHOOK] ⚠️ ASSINATURA INVÁLIDA — Possível tentativa de fraude! IP: ${req.ip}`);
        return res.status(401).json({ error: 'Webhook não autorizado: assinatura inválida.' });
    }

    console.log(`[WEBHOOK] ✅ Notificação autenticada com sucesso — ID: ${dataId}`);
    next();
}

module.exports = { verifyMercadoPagoWebhook };
