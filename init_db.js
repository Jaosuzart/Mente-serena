const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });
  
  console.log('✅ Conectado ao banco de dados!');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INT AUTO_INCREMENT PRIMARY KEY, 
      preference_id VARCHAR(100),
      order_id VARCHAR(100), 
      nome VARCHAR(100), 
      email VARCHAR(254),
      plano VARCHAR(50), 
      status VARCHAR(20), 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Tabela pedidos criada!');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS filtros_usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY, 
      email VARCHAR(254) UNIQUE,
      plano VARCHAR(50), 
      pagamento VARCHAR(50), 
      cupom VARCHAR(50),
      desconto_aplicado INT, 
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Tabela filtros_usuarios criada!');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS uso_cupons (
      id INT AUTO_INCREMENT PRIMARY KEY, 
      email VARCHAR(254),
      cupom VARCHAR(50), 
      desconto_aplicado INT, 
      order_id VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Tabela uso_cupons criada!');

  await connection.end();
  console.log('🎉 Banco de dados inicializado com sucesso!');
}

main().catch(console.error);
