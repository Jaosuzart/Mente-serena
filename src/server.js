const app = require('./app');
const pool = require('./config/database');
const { initializeDatabase } = require('./config/initialize-database');

async function start() {
    let server;
    try {
        // Não aceita tráfego antes de o banco estar pronto.
        await initializeDatabase(pool);
        server = await new Promise((resolve, reject) => {
            const listener = app.listen(process.env.PORT || 3000, () => resolve(listener));
            listener.once('error', reject);
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
        // Limita a espera por clientes lentos e sockets externos persistentes.
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
