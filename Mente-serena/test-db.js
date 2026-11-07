require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function testConnectionAndInit() {
    console.log('🔄 Testando conexão com o banco de dados na Aiven...');
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '13333'),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: { rejectUnauthorized: false }
        });

        console.log('✅ Conexão bem-sucedida pelo Node.js!');

        console.log('🔄 Tentando rodar o init.sql para criar as tabelas...');
        const sqlPath = path.join(__dirname, 'src', 'config', 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        const queries = sql.split(';').map(q => q.trim()).filter(q => q.length > 0);

        for (let query of queries) {
            await connection.query(query);
        }

        console.log('✅ Tabelas criadas/verificadas com sucesso!');
        await connection.end();

    } catch (err) {
        console.error('❌ Erro de conexão no Node.js:', err.message);
        if (err.message.includes('Access denied')) {
            console.log('💡 DICA: Parece que a senha no .env está incorreta.');
        }
    }
}

testConnectionAndInit();
