const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline/promises');

const siteOrigin = 'https://mente-serena-web.suzartlimacastrojoaomarcelo.workers.dev';

function configurePayments(value, configPath = path.join(__dirname, '../wrangler.jsonc')) {
    let backend;
    try {
        backend = new URL(value.trim());
    } catch {
        throw new Error('Informe a URL HTTPS pública da API Node/Express. Consulte docs/ativar-pagamentos.md se ela ainda não foi publicada.');
    }
    if (backend.protocol !== 'https:' || backend.username || backend.password ||
        backend.pathname !== '/' || backend.search || backend.hash) {
        throw new Error('Use apenas a origem HTTPS da API, sem senhas, caminhos, parâmetros ou /create_preference.');
    }
    if (backend.origin === siteOrigin || ['localhost', '127.0.0.1', '[::1]'].includes(backend.hostname)) {
        throw new Error('Use o endereço público do servidor da API. O endereço do site workers.dev e localhost não servem como BACKEND_URL.');
    }

    // Only this public URL is copied. Local payment and database secrets stay private.
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, ''));
    config.vars = { ...config.vars, BACKEND_URL: backend.origin };
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
    return backend.origin;
}

async function main() {
    let value = process.argv[2];
    if (!value && process.stdin.isTTY) {
        const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
        try {
            value = await prompt.question('Qual é a URL HTTPS da API publicada no Render ou outro servidor? ');
        } finally {
            prompt.close();
        }
    }
    const backend = configurePayments(value || '');
    console.log(`BACKEND_URL configurada em wrangler.jsonc: ${backend}`);
    console.log('A rota POST /create_preference será encaminhada para essa API.');
    console.log('Publique a configuração com: npm run deploy:cloudflare');
}

if (require.main === module) {
    main().catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    });
}

module.exports = { configurePayments };
