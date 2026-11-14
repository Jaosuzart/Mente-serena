const defaultDb = require('../config/database');

class AuditLogModel {
    static async log({ usuario_id, acao, detalhes = null, ip_address = null }, db = defaultDb) {
        try {
            const detalhesStr = detalhes ? (typeof detalhes === 'string' ? detalhes : JSON.stringify(detalhes)) : null;
            const [result] = await db.query(
                `INSERT INTO audit_logs (usuario_id, acao, detalhes, ip_address) VALUES (?, ?, ?, ?)`,
                [usuario_id, acao, detalhesStr, ip_address]
            );
            return result.insertId;
        } catch (error) {
            // Em auditoria, falhas de log secundárias não devem derrubar o fluxo transacional principal
            console.error('[AuditLog] Falha ao registrar log:', error.message);
            return null;
        }
    }

    static async listRecent(limit = 50, db = defaultDb) {
        const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
        const [rows] = await db.query(
            `SELECT a.*, u.nome AS usuario_nome, u.email AS usuario_email, u.role AS usuario_role
             FROM audit_logs a
             LEFT JOIN usuarios u ON u.id = a.usuario_id
             ORDER BY a.created_at DESC LIMIT ?`,
            [safeLimit]
        );
        return rows;
    }
}

module.exports = AuditLogModel;
