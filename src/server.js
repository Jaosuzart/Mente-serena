const app = require('./app');
const pool = require('./config/database');
const { initializeDatabase } = require('./config/initialize-database');

async function start() {
    let server;
    try {
        await initializeDatabase(pool);
        const port = process.env.PORT || 3000;
        server = await new Promise((resolve, reject) => {
            const listener = app.listen(port, () => resolve(listener));
            listener.once('error', err => {
                if (err.code === 'EADDRINUSE') {
                    console.error(
                        `\n❌ Porta ${port} já está em uso.\n` +
                        `   Execute no terminal para liberar:\n\n` +
                        `   # Windows (Git Bash / PowerShell):\n` +
                        `   node scripts/kill-port.js && NODE_ENV=development node server.js\n\n` +
                        `   # Ou use o atalho npm:\n` +
                        `   npm run dev:safe\n`
                    );
                }
                reject(err);
            });
        });
    } catch (error) {
        await pool.end();
        throw error;
    }
    console.log(`Servidor iniciado em http://localhost:${server.address().port}`);
    if (process.env.WHATSAPP_ENABLED !== 'false') {
        require('./services/whatsapp').initWhatsApp().catch(error => {
            console.error('Falha ao iniciar WhatsApp:', error.message);
        });
    }

    let stopping = false;
    const shutdown = () => {
        if (stopping) return;
        stopping = true;
        const deadline = setTimeout(() => process.exit(1), 15000);
        deadline.unref();
        server.close(async error => {
            try {
                await pool.end();
                process.exit(error ? 1 : 0);
            } catch (closeError) {
                console.error('Falha ao encerrar banco:', closeError.message);
                process.exit(1);
            }
        });
    };
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
    return server;
}
module.exports = { start };
