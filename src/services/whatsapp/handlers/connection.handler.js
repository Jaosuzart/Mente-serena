const { DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

/**
 * @param {object} 
 * @param {function} r
 * @param {function} 
 */
function handleConnectionUpdate(update, reconnectCallback, setStateCallback) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
        console.log('\n[WHATSAPP] Escaneie o QR Code abaixo com seu celular (Aparelhos Conectados):');
        qrcode.generate(qr, { small: true });

        const whatsappNumber = process.env.WHATSAPP_NUMBER || '5571982767129';
        const welcomeMsg = process.env.WHATSAPP_WELCOME_MSG || 'ol\u00e1, seja bem-vindo ao curso mente serena';
        const whatsappApiUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(welcomeMsg)}`;

        console.log('\n[WHATSAPP] \ud83d\udd17 Ou acesse a API externa abaixo (Segunda Op\u00e7\u00e3o - mensagem de boas-vindas):');
        console.log(`${whatsappApiUrl}\n`);

        setStateCallback('WAITING_QR', qr);
    }
    if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`[WHATSAPP] Conexão fechada. Motivo: ${lastDisconnect?.error?.message || 'Desconhecido'}. Reconectando: ${shouldReconnect}`);

        if (shouldReconnect) {
            setStateCallback('RECONNECTING');
            reconnectCallback();
        } else {
            console.log('[WHATSAPP] Deslogado. Apague a pasta "src/services/whatsapp/auth_info" para gerar um novo QR Code do zero.');
            setStateCallback('LOGGED_OUT');
        }
    }
    else if (connection === 'open') {
        console.log('[WHATSAPP] ✅ Conectado com sucesso!');
        setStateCallback('CONNECTED');
    }
}

module.exports = { handleConnectionUpdate };
