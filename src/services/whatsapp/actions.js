/**
 * @param {object} sock A instância do socket do WhatsApp
 * @param {string} phone Número de telefone com DDI (ex: 5511999999999)
 * @param {string} message Texto da mensagem
 */
async function sendTextMessage(sock, phone, message) {
    if (!sock) throw new Error("WhatsApp não inicializado.");

    const jid = `${phone}@s.whatsapp.net`;

    await sock.sendMessage(jid, { text: message });
}


module.exports = { sendTextMessage };
