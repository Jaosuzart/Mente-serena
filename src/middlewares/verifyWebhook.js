const crypto = require('crypto');

/**
 * Compara duas strings de forma resistente a timing attacks.
 * NÃO use === para comparar hashes — vulnerável a ataques de tempo.
 */
function safeCompare(a, b) {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');

    if (bufA.length !== bufB.length) return false;

    return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Middleware: valida a assinatura HMAC-SHA256 do Mercado Pago.
 * 
 * O header `x-signature` tem formato:
 *   ts=<timestamp>,v1=<hash>
 * 
 * O payload assinado pelo MP é:
 *   id:<dataId>;request-id:<requestId>;ts:<timestamp>;
 */
function verifyMercadoPagoWebhook(req, res, next) {
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;

    // Se não houver secret configurado, bloqueia por segurança
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

    // Extrai timestamp (ts) e hash (v1) do header
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

    // Previne replay attacks: rejeita notificações com timestamp > 5 minutos atrás
    const now = Math.floor(Date.now() / 1000);
    const tsNumber = parseInt(ts, 10);
    const MAX_AGE_SEC = 300; // 5 minutos

    if (isNaN(tsNumber) || Math.abs(now - tsNumber) > MAX_AGE_SEC) {
        console.warn(`[WEBHOOK] Timestamp expirado (possível replay attack) — IP: ${req.ip}`);
        return res.status(401).json({ error: 'Webhook não autorizado: timestamp expirado.' });
    }

    // Monta o payload que o MP assinou
    const dataId = req.query.id || req.body?.data?.id || '';
    const manifest = `id:${dataId};request-id:${requestId || ''};ts:${ts};`;

    // Calcula o hash esperado com o nosso secret
    const expectedHash = crypto
        .createHmac('sha256', webhookSecret)
        .update(manifest)
        .digest('hex');

    // Comparação criptograficamente segura (resistente a timing attacks)
    if (!safeCompare(expectedHash, receivedHash)) {
        console.warn(`[WEBHOOK] ⚠️ ASSINATURA INVÁLIDA — Possível tentativa de fraude! IP: ${req.ip}`);
        return res.status(401).json({ error: 'Webhook não autorizado: assinatura inválida.' });
    }

    // Assinatura válida — notificação é legítima
    console.log(`[WEBHOOK] ✅ Notificação autenticada com sucesso — ID: ${dataId}`);
    next();
}

module.exports = { verifyMercadoPagoWebhook };
