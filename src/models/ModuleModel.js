const defaultDb = require('../config/database');

class ModuleModel {
    static async create({ curso_id, instrutor_responsavel_id, titulo, ordem = 1 }, db = defaultDb) {
        const [result] = await db.query(
            `INSERT INTO modulos (curso_id, instrutor_responsavel_id, titulo, ordem) VALUES (?, ?, ?, ?)`,
            [curso_id, instrutor_responsavel_id, titulo.trim(), ordem]
        );
        return result.insertId;
    }

    static async findById(id, db = defaultDb) {
        const [rows] = await db.query(
            `SELECT m.*, u.nome AS instrutor_nome, u.email AS instrutor_email 
             FROM modulos m 
             INNER JOIN usuarios u ON u.id = m.instrutor_responsavel_id 
             WHERE m.id = ? LIMIT 1`,
            [id]
        );
        return rows[0] || null;
    }

    static async findByCourse(cursoId, db = defaultDb) {
        const [rows] = await db.query(
            `SELECT m.*, u.nome AS instrutor_nome 
             FROM modulos m 
             INNER JOIN usuarios u ON u.id = m.instrutor_responsavel_id 
             WHERE m.curso_id = ? 
             ORDER BY m.ordem ASC, m.id ASC`,
            [cursoId]
        );
        return rows;
    }

    static async findByInstructor(instrutorId, db = defaultDb) {
        const [rows] = await db.query(
            `SELECT m.*, c.titulo AS curso_titulo, c.slug AS curso_slug 
             FROM modulos m 
             INNER JOIN cursos c ON c.id = m.curso_id 
             WHERE m.instrutor_responsavel_id = ? 
             ORDER BY c.titulo ASC, m.ordem ASC`,
            [instrutorId]
        );
        return rows;
    }
}

module.exports = ModuleModel;
