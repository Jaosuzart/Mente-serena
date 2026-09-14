const { DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

/**
 * Lida com as atualizações de conexão (QR Code, Conexão aberta, Desconexões)
 * @param {object} update Objeto de atualização do Baileys
 * @param {function} reconnectCallback Função a ser chamada se precisar reconectar
 * @param {function} setStateCallback Função para atualizar o estado pro frontend
 */
function handleConnectionUpdate(update, reconnectCallback, setStateCallback) {
    const { connection, lastDisconnect, qr } = update;

    // Se receber um evento pedindo QR/Autenticação
    if (qr) {
        console.log('\n[WHATSAPP] Escaneie o QR Code abaixo:');
        qrcode.generate(qr, { small: true });

        const whatsappNumber = process.env.WHATSAPP_NUMBER || '5571982767129';
        const whatsappApiUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(qr)}`;

        console.log('\n[WHATSAPP] 🔗 Acesse a API externa abaixo para ser redirecionado diretamente:');
        console.log(`${whatsappApiUrl}\n`);

        setStateCallback('WAITING_QR', qr);
    }

    // Se a conexão for fechada
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
