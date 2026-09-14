const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');

async function createConnection() {
    const authPath = path.join(process.cwd(), 'auth_info_baileys');
    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false
    });

    return { sock, saveCreds };
}

module.exports = { createConnection };
