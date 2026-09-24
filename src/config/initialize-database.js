async function initializeDatabase(pool) {
    await pool.query(`CREATE TABLE IF NOT EXISTS free_spots (
        id INT PRIMARY KEY,
        spots_taken INT NOT NULL DEFAULT 0
    )`);
    await pool.query('INSERT IGNORE INTO free_spots (id, spots_taken) VALUES (1, 0)');
}
module.exports = { initializeDatabase };
