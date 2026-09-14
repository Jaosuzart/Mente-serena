const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    // A URI de conexão com o banco agora é carregada com segurança do arquivo .env
    const aivenURI = process.env.DATABASE_URL;
    
    if (!aivenURI) {
      throw new Error("DATABASE_URL não encontrada no arquivo .env");
    }
    
    console.log('Conectando via URI segura do .env...');
    const connection = await mysql.createConnection(aivenURI);
    
    console.log('✅ Conectado com sucesso!');
    console.log('Criando a tabela free_spots...');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS free_spots (
          id INT PRIMARY KEY,
          spots_taken INT NOT NULL DEFAULT 0
      )
    `);
    
    await connection.query(`INSERT IGNORE INTO free_spots (id, spots_taken) VALUES (1, 0)`);
    
    console.log('✅ Tabela criada e inicializada com sucesso!');
    await connection.end();
  } catch (err) {
    console.error('❌ Erro ao criar a tabela:', err);
  }
}

run();
