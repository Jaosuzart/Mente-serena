const fs = require('node:fs');
const dotenv = require('dotenv');
const { buildDatabaseOptions } = require('./database-options');

function validateTestEnvironment(env) {
    const missing = [];
    if (env.NODE_ENV !== 'test') missing.push('NODE_ENV=test');
    if (env.WHATSAPP_ENABLED !== 'false') missing.push('WHATSAPP_ENABLED=false');
    if (env.DATABASE_URL) {
        try {
            const uri = new URL(env.DATABASE_URL);
            if (uri.protocol !== 'mysql:' || !uri.hostname || uri.pathname.length < 2) {
                missing.push('DATABASE_URL válida');
            }
        } catch { missing.push('DATABASE_URL válida'); }
    } else {
        for (const key of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
            if (!env[key]?.trim() || env[key] === 'usuario_de_teste') missing.push(key);
        }
    }
    if (!env.MP_ACCESS_TOKEN?.trim()) missing.push('MP_ACCESS_TOKEN');
    if (missing.length) {
        throw new Error(`Configure .env.test.local: ${missing.join(', ')}. Nenhuma conexão externa foi iniciada.`);
    }
    return { database: buildDatabaseOptions(env), accessToken: env.MP_ACCESS_TOKEN };
}

function loadTestEnvironment(file = '.env.test.local') {
    if (!fs.existsSync(file)) {
        throw new Error('Crie .env.test.local a partir de .env.test.example e preencha as credenciais de teste.');
    }
    return validateTestEnvironment(dotenv.parse(fs.readFileSync(file)));
}

module.exports = { loadTestEnvironment, validateTestEnvironment };
