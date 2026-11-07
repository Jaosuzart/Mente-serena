async function initializeDatabase(pool) {
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
