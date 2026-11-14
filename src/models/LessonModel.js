const defaultDb = require('../config/database');

class LessonModel {
    static async create({ modulo_id, titulo, video_url = '', duracao_segundos = 0, material_apoio_url = '', status = 'em_revisao', ordem = 1 }, db = defaultDb) {
        const [result] = await db.query(
            `INSERT INTO aulas (modulo_id, titulo, video_url, duracao_segundos, material_apoio_url, status, ordem)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [modulo_id, titulo.trim(), video_url, duracao_segundos, material_apoio_url, status, ordem]
        );
        return result.insertId;
    }

    static async findById(id, db = defaultDb) {
        const [rows] = await db.query(
            `SELECT a.*, m.titulo AS modulo_titulo, m.curso_id, m.instrutor_responsavel_id, c.admin_id
             FROM aulas a
             INNER JOIN modulos m ON m.id = a.modulo_id
             INNER JOIN cursos c ON c.id = m.curso_id
             WHERE a.id = ? LIMIT 1`,
            [id]
        );
        return rows[0] || null;
    }

    static async findByModule(moduloId, includeDrafts = false, db = defaultDb) {
        let sql = `SELECT * FROM aulas WHERE modulo_id = ?`;
        const params = [moduloId];

        if (!includeDrafts) {
            sql += ` AND status = 'publicada'`;
        }

        sql += ` ORDER BY ordem ASC, id ASC`;
        const [rows] = await db.query(sql, params);
        return rows;
    }

    static async updateStatus(lessonId, status, db = defaultDb) {
        const [result] = await db.query(
            `UPDATE aulas SET status = ? WHERE id = ?`,
            [status, lessonId]
        );
        return result.affectedRows > 0;
    }

    static async updateContent(lessonId, { titulo, video_url, duracao_segundos, material_apoio_url, ordem }, db = defaultDb) {
        const [result] = await db.query(
            `UPDATE aulas SET 
                titulo = COALESCE(?, titulo),
                video_url = COALESCE(?, video_url),
                duracao_segundos = COALESCE(?, duracao_segundos),
                material_apoio_url = COALESCE(?, material_apoio_url),
                ordem = COALESCE(?, ordem)
             WHERE id = ?`,
            [titulo, video_url, duracao_segundos, material_apoio_url, ordem, lessonId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = LessonModel;
