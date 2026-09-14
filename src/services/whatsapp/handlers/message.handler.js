/**
 * @param {object} 
 * @param {object}
 */
async function handleMessagesUpsert(m, sock) {
    const msg = m.messages[0];

    if (!msg.message) return;

    if (msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    console.log(`[WHATSAPP] Nova mensagem recebida de ${sender}: ${text}`);

}

module.exports = { handleMessagesUpsert };
