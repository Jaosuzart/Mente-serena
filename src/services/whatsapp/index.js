const { handleMessagesUpsert } = require('./handlers/message.handler');
const { sendTextMessage } = require('./actions');

let sockInstance = null;
let currentQr = null;
let connectionStatus = 'DISCONNECTED';

function setConnectionState(status, qr = null) {
    connectionStatus = status;
    currentQr = qr;
}
function getConnectionState() {
    return { status: connectionStatus, qr: currentQr };
}
async function initWhatsApp() {
    try {
        const { createConnection } = require('./connection');
        const { handleConnectionUpdate } = require('./handlers/connection.handler');
        setConnectionState('CONNECTING');
        const { sock, saveCreds } = await createConnection();
        sockInstance = sock;

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', (update) => {
            handleConnectionUpdate(update, initWhatsApp, setConnectionState);
        });

        sock.ev.on('messages.upsert', async (m) => {
            await handleMessagesUpsert(m, sock);
        });

    } catch (error) {
        console.error('[WHATSAPP] Erro ao inicializar o Baileys:', error);
        setConnectionState('ERROR');
    }
}

/**
 * @param {string} phone Número de telefone com DDI
 * @param {string} message Mensagem a enviar
 */
async function sendMessage(phone, message) {
    return sendTextMessage(sockInstance, phone, message);
}

module.exports = {
    initWhatsApp,
    sendMessage,
    getConnectionState
};
