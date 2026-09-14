const db = require('../../../config/database');

async function registrarFiltroUsuario(filterData) {
    const { email, plano, pagamento, cupom = null, desconto = 0 } = filterData;

    const [result] = await db.query(
        `INSERT INTO filtros_usuarios (email, plano, pagamento, cupom, desconto_aplicado)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           plano = VALUES(plano),
           pagamento = VALUES(pagamento),
           cupom = VALUES(cupom),
           desconto_aplicado = VALUES(desconto_aplicado),
           updated_at = CURRENT_TIMESTAMP`,
        [email, plano, pagamento, cupom, desconto]
    );

    return result.insertId || result.affectedRows;
}

async function buscarFiltroUsuario(email) {
    const [rows] = await db.query(
        'SELECT * FROM filtros_usuarios WHERE email = ? ORDER BY updated_at DESC LIMIT 1',
        [email]
    );
    return rows.length > 0 ? rows[0] : null;
}

async function isUsuarioNovo(email) {
    const [rows] = await db.query(
        "SELECT id FROM pedidos WHERE email = ? AND status = 'aprovado' LIMIT 1",
        [email]
    );
    return rows.length === 0;
}

async function listarFiltrosUsuarios(limit = 50) {
    const [rows] = await db.query(
        'SELECT * FROM filtros_usuarios ORDER BY updated_at DESC LIMIT ?',
        [limit]
    );
    return rows;
}

module.exports = {
    registrarFiltroUsuario,
    buscarFiltroUsuario,
    isUsuarioNovo,
    listarFiltrosUsuarios,
};
