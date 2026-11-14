const ModuleModel = require('../../models/ModuleModel');
const LessonModel = require('../../models/LessonModel');
const AuditLogModel = require('../../models/AuditLogModel');

class InstructorService {
    static async listMyModules(instructorUser, db) {
        if (instructorUser.role === 'admin') {
            const defaultDb = require('../../config/database');
            const targetDb = db || defaultDb;
            const [allModules] = await targetDb.query(
                `SELECT m.*, c.titulo AS curso_titulo, c.slug AS curso_slug, u.nome AS instrutor_nome
                 FROM modulos m
                 INNER JOIN cursos c ON c.id = m.curso_id
                 INNER JOIN usuarios u ON u.id = m.instrutor_responsavel_id
                 ORDER BY c.titulo ASC, m.ordem ASC`
            );
            return allModules;
        }

        return ModuleModel.findByInstructor(instructorUser.id, db);
    }

    /**
     * O instrutor submete uma nova aula ou rascunho de aula
     * Regra arquitetural: aulas submetidas por instrutor entram SEMPRE em status 'em_revisao'.
     * Apenas o Administrador pode promovê-las a 'publicada'.
     */
    static async submitLessonDraft({ moduloId, titulo, videoUrl = '', duracaoSegundos = 0, materialApoioUrl = '', ordem = 1 }, instructorUser, db) {
        if (!moduloId || !titulo) {
            throw new Error('Campos obrigatórios: moduloId e titulo.');
        }

        const modulo = await ModuleModel.findById(moduloId, db);
        if (!modulo) {
            throw new Error('Módulo não encontrado.');
        }

        // Validação de isolamento: instrutor só pode adicionar aulas aos seus próprios módulos
        if (instructorUser.role !== 'admin' && modulo.instrutor_responsavel_id !== instructorUser.id) {
            throw new Error('Permissão negada: você só pode submeter aulas nos módulos sob sua responsabilidade.');
        }

        const lessonId = await LessonModel.create({
            modulo_id: moduloId,
            titulo,
            video_url: videoUrl,
            duracao_segundos: duracaoSegundos,
            material_apoio_url: materialApoioUrl,
            status: 'em_revisao', // Garante que a aula aguarda revisão do Administrador
            ordem
        }, db);

        await AuditLogModel.log({
            usuario_id: instructorUser.id,
            acao: 'SUBMETEU_RASCUNHO_AULA',
            detalhes: { lessonId, moduloId, titulo, autorId: instructorUser.id }
        }, db);

        return LessonModel.findById(lessonId, db);
    }

    /**
     * Consulta as aulas de um módulo com visão de autor
     */
    static async getModuleLessons(moduloId, instructorUser, db) {
        const modulo = await ModuleModel.findById(moduloId, db);
        if (!modulo) {
            throw new Error('Módulo não encontrado.');
        }

        if (instructorUser.role !== 'admin' && modulo.instrutor_responsavel_id !== instructorUser.id) {
            throw new Error('Permissão negada para visualizar este módulo.');
        }

        return LessonModel.findByModule(moduloId, true, db); // includeDrafts = true
    }
}

module.exports = InstructorService;
