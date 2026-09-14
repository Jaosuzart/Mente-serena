const { createConnection } = require('./connection');
const { handleConnectionUpdate } = require('./handlers/connection.handler');
const { handleMessagesUpsert } = require('./handlers/message.handler');
const { sendTextMessage } = require('./actions');

let sockInstance = null;
let currentQr = null;
let connectionStatus = 'DISCONNECTED';

/**
 * Atualiza o status e o QR code para o frontend
 */
function setConnectionState(status, qr = null) {
    connectionStatus = status;
    currentQr = qr;
}

/**
 * Retorna o estado atual para a API
 */
function getConnectionState() {
    return { status: connectionStatus, qr: currentQr };
}

/**
 * Inicializa o serviço do WhatsApp Baileys orquestrando conexão e handlers
 */
async function initWhatsApp() {
    try {
        setConnectionState('CONNECTING');
        const { sock, saveCreds } = await createConnection();
        sockInstance = sock; // Guardar a instância na memória do módulo para poder ser usada depois nas ações

        // Atualizar as credenciais sempre que necessário
        sock.ev.on('creds.update', saveCreds);

        // Lidar com as atualizações de conexão (QR Code, conexão concluída, fechamento)
        sock.ev.on('connection.update', (update) => {
            handleConnectionUpdate(update, initWhatsApp, setConnectionState);
        });

        // Lidar com recebimento de mensagens
        sock.ev.on('messages.upsert', async (m) => {
            await handleMessagesUpsert(m, sock);
        });

    } catch (error) {
        console.error('[WHATSAPP] Erro ao inicializar o Baileys:', error);
        setConnectionState('ERROR');
    }
}

/**
 * Função wrapper pública para enviar mensagens usando a instância atual do socket
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
