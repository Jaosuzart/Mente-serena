const mysql = require('mysql2/promise');
const dbUri = process.env.DATABASE_URL || `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?ssl={"rejectUnauthorized":false}`;

const pool = mysql.createPool({
    uri: dbUri,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONN_LIMIT) || 10,
    queueLimit: 0
});

(async () => {
    let setupConn;
    try {
        setupConn = await mysql.createConnection(dbUri);

        await setupConn.query(`
            CREATE TABLE IF NOT EXISTS free_spots (
                id INT PRIMARY KEY,
                spots_taken INT NOT NULL DEFAULT 0
            );
        `);
        await setupConn.query(`
            INSERT IGNORE INTO free_spots (id, spots_taken) VALUES (1, 0);
        `);
        console.log('✅ Banco de dados: Tabelas verificadas/inicializadas.');
    } catch (err) {
        console.error('⚠️ Aviso: Não foi possível verificar as tabelas automaticamente:', err.message);
    } finally {
        if (setupConn) await setupConn.end();
    }
})();

module.exports = pool;
