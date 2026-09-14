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
  
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS free_spots (
      id INT PRIMARY KEY,
      spots_taken INT NOT NULL DEFAULT 0
    )
  `);
  
  await connection.execute(`
    INSERT IGNORE INTO free_spots (id, spots_taken) VALUES (1, 0)
  `);
  
  console.log('? free_spots table created successfully.');
  await connection.end();
}
main().catch(console.error);
