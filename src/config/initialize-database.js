async function initializeDatabase(pool) {
    await pool.query(`CREATE TABLE IF NOT EXISTS pedidos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        preference_id VARCHAR(100),
        order_id VARCHAR(100),
        payment_id VARCHAR(100),
        nome VARCHAR(100),
        email VARCHAR(254),
        plano VARCHAR(50),
        status VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order_id (order_id),
        INDEX idx_payment_id (payment_id),
        INDEX idx_preference_id (preference_id)
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS filtros_usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(254) UNIQUE,
        plano VARCHAR(50),
        pagamento VARCHAR(50),
        cupom VARCHAR(50),
        desconto_aplicado INT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS uso_cupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(254),
        cupom VARCHAR(50),
        desconto_aplicado INT,
        order_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);


    await pool.query(`CREATE TABLE IF NOT EXISTS free_spots (
        id INT PRIMARY KEY,
        spots_taken INT NOT NULL DEFAULT 0
    )`);
    await pool.query('INSERT IGNORE INTO free_spots (id, spots_taken) VALUES (1, 0)');
    await pool.query(`CREATE TABLE IF NOT EXISTS free_spot_claims (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(254) NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
}
module.exports = { initializeDatabase };
