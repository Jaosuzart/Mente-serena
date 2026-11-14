const db = required('../config/database');

(async () => {
    try {
        const [rows] = await db.execute(
            'SELECT id, order_id, preference_id, payment_id, status, plano, email, created_at FROM pedidos ORDER BY created_at DESC LIMIT 20'
        );
        console.table(rows);
    } catch (err) {
        console.error('Erro ao consultar pedidos:', err.message);
    } finally {
        process.exit(0);
    }
})();
