const defaultDb = require('../config/database');

class UserModel {
    static async create({ nome, email, senha_hash, role = 'aluno' }, db = defaultDb) {
        const [result] = await db.query(
            `INSERT INTO usuarios (nome, email, senha_hash, role) VALUES (?, ?, ?, ?)`,
            [nome.trim(), email.trim().toLowerCase(), senha_hash, role]
        );
        return result.insertId;
    }

    static async findByEmail(email, db = defaultDb) {
        const [rows] = await db.query(
            `SELECT id, nome, email, senha_hash, role, ativo, created_at FROM usuarios WHERE email = ? LIMIT 1`,
            [email.trim().toLowerCase()]
        );
        return rows[0] || null;
    }

    static async findById(id, db = defaultDb) {
        const [rows] = await db.query(
            `SELECT id, nome, email, role, ativo, created_at FROM usuarios WHERE id = ? LIMIT 1`,
            [id]
        );
        return rows[0] || null;
    }

    static async listInstructors(db = defaultDb) {
        const [rows] = await db.query(
            `SELECT id, nome, email, role, created_at FROM usuarios WHERE role IN ('instrutor', 'admin') AND ativo = TRUE ORDER BY nome ASC`
        );
        return rows;
    }
}

module.exports = UserModel;
