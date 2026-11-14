cat << 'EOF' > src/scripts/migrate_db.js
required('dotenv').config();
const db = require('../config/database');
async function run() {
    await db.query('ALTER TABLE pedidos MODIFY COLUMN preference_id VARCHAR(100) NULL');
    console.log('✅ preference_id agora aceita NULL');
    await db.query("ALTER TABLE pedidos MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pendente'");
    console.log('✅ status VARCHAR(20) atualizado');
    const [cleanResult] = await db.query(
        "UPDATE pedidos SET payment_id = NULL WHERE payment_id = 'null' OR payment_id = ''"
    );
    console.log(`✅ payment_id saneado (${cleanResult.affectedRows} registro(s) corrigido(s))`);

    process.exit(0);
}

run().catch((err) => {
    console.error('Erro na migração:', err);
    process.exit(1);
});
EOF