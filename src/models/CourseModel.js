const defaultDb = require('../config/database');

class CourseModel {
    static async create({ slug, titulo, descricao, categoria, admin_id, status = 'rascunho' }, db = defaultDb) {
        const [result] = await db.query(
            `INSERT INTO cursos (slug, titulo, descricao, categoria, admin_id, status) VALUES (?, ?, ?, ?, ?, ?)`,
            [slug.trim().toLowerCase(), titulo.trim(), descricao || '', categoria.trim(), admin_id, status]
        );
        return result.insertId;
    }

    static async findById(id, db = defaultDb) {
        const [rows] = await db.query(
            `SELECT c.*, u.nome AS admin_nome, u.email AS admin_email 
             FROM cursos c 
             INNER JOIN usuarios u ON u.id = c.admin_id 
             WHERE c.id = ? LIMIT 1`,
            [id]
        );
        return rows[0] || null;
    }

    static async findBySlug(slug, db = defaultDb) {
        const [rows] = await db.query(
            `SELECT c.*, u.nome AS admin_nome 
             FROM cursos c 
             INNER JOIN usuarios u ON u.id = c.admin_id 
             WHERE c.slug = ? LIMIT 1`,
            [slug.trim().toLowerCase()]
        );
        return rows[0] || null;
    }

    static async listAll(filters = {}, db = defaultDb) {
        let sql = `SELECT c.*, u.nome AS admin_nome FROM cursos c INNER JOIN usuarios u ON u.id = c.admin_id WHERE 1=1`;
        const params = [];

        if (filters.status) {
            sql += ` AND c.status = ?`;
            params.push(filters.status);
        }
        if (filters.categoria) {
            sql += ` AND c.categoria = ?`;
            params.push(filters.categoria);
        }
        if (filters.admin_id) {
            sql += ` AND c.admin_id = ?`;
            params.push(filters.admin_id);
        }

        sql += ` ORDER BY c.created_at DESC`;
        const [rows] = await db.query(sql, params);
        return rows;
    }

    static async updateStatus(courseId, status, db = defaultDb) {
        const [result] = await db.query(
            `UPDATE cursos SET status = ? WHERE id = ?`,
            [status, courseId]
        );
        return result.affectedRows > 0;
    }

    static async assignInstructor({ curso_id, instrutor_id, tipo_docente = 'titular', bio_especifica = '' }, db = defaultDb) {
        const [result] = await db.query(
            `INSERT INTO curso_instrutores (curso_id, instrutor_id, tipo_docente, bio_especifica)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE tipo_docente = VALUES(tipo_docente), bio_especifica = VALUES(bio_especifica)`,
            [curso_id, instrutor_id, tipo_docente, bio_especifica]
        );
        return result.insertId || true;
    }

    static async getInstructors(courseId, db = defaultDb) {
        const [rows] = await db.query(
            `SELECT ci.id AS vinculo_id, ci.tipo_docente, ci.bio_especifica, u.id AS instrutor_id, u.nome, u.email, u.role
             FROM curso_instrutores ci
             INNER JOIN usuarios u ON u.id = ci.instrutor_id
             WHERE ci.curso_id = ?
             ORDER BY FIELD(ci.tipo_docente, 'titular', 'co_instrutor', 'convidado'), u.nome ASC`,
            [courseId]
        );
        return rows;
    }
}

module.exports = CourseModel;
