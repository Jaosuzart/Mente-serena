const CourseModel = require('../../models/CourseModel');
const ModuleModel = require('../../models/ModuleModel');
const LessonModel = require('../../models/LessonModel');
const AuditLogModel = require('../../models/AuditLogModel');
const UserModel = require('../../models/UserModel');

class CourseAdminService {
    static async createCourse({ slug, titulo, descricao, categoria, status = 'rascunho' }, adminUser, db) {
        if (!slug || !titulo || !categoria) {
            throw new Error('Campos obrigatórios: slug, titulo e categoria são necessários.');
        }

        const existing = await CourseModel.findBySlug(slug, db);
        if (existing) {
            throw new Error(`Já existe um curso cadastrado com o slug '${slug}'.`);
        }

        const courseId = await CourseModel.create({
            slug,
            titulo,
            descricao,
            categoria,
            admin_id: adminUser.id,
            status
        }, db);

        await AuditLogModel.log({
            usuario_id: adminUser.id,
            acao: 'CRIOU_CURSO',
            detalhes: { courseId, slug, titulo, categoria }
        }, db);

        return CourseModel.findById(courseId, db);
    }
    static async assignInstructor({ cursoId, instrutorId, tipoDocente = 'titular', bioEspecifica = '' }, adminUser, db) {
        const course = await CourseModel.findById(cursoId, db);
        if (!course) {
            throw new Error('Curso não encontrado.');
        }

        const instructor = await UserModel.findById(instrutorId, db);
        if (!instructor || !['instrutor', 'admin'].includes(instructor.role)) {
            throw new Error('Usuário informado não é um instrutor válido.');
        }

        await CourseModel.assignInstructor({
            curso_id: cursoId,
            instrutor_id: instrutorId,
            tipo_docente: tipoDocente,
            bio_especifica: bioEspecifica
        }, db);

        await AuditLogModel.log({
            usuario_id: adminUser.id,
            acao: 'VINCULOU_INSTRUTOR',
            detalhes: { cursoId, instrutorId, instrutorNome: instructor.nome, tipoDocente }
        }, db);

        return CourseModel.getInstructors(cursoId, db);
    }
    static async updateCourseStatus(courseId, status, adminUser, db) {
        const allowedStatuses = ['rascunho', 'publicado', 'arquivado'];
        if (!allowedStatuses.includes(status)) {
            throw new Error(`Status inválido. Escolha entre: ${allowedStatuses.join(', ')}`);
        }

        const course = await CourseModel.findById(courseId, db);
        if (!course) {
            throw new Error('Curso não encontrado.');
        }

        await CourseModel.updateStatus(courseId, status, db);

        await AuditLogModel.log({
            usuario_id: adminUser.id,
            acao: 'ALTEROU_STATUS_CURSO',
            detalhes: { courseId, statusAnterior: course.status, statusNovo: status }
        }, db);

        return CourseModel.findById(courseId, db);
    }
    static async createModule({ cursoId, instrutorId, titulo, ordem = 1 }, adminUser, db) {
        const course = await CourseModel.findById(cursoId, db);
        if (!course) {
            throw new Error('Curso não encontrado.');
        }

        const instructor = await UserModel.findById(instrutorId, db);
        if (!instructor) {
            throw new Error('Instrutor responsável não encontrado.');
        }

        const moduleId = await ModuleModel.create({
            curso_id: cursoId,
            instrutor_responsavel_id: instrutorId,
            titulo,
            ordem
        }, db);

        await AuditLogModel.log({
            usuario_id: adminUser.id,
            acao: 'CRIOU_MODULO',
            detalhes: { moduleId, cursoId, instrutorId, titulo }
        }, db);

        return ModuleModel.findById(moduleId, db);
    }
    static async reviewLesson(lessonId, status, adminUser, db) {
        const allowedStatuses = ['em_revisao', 'aprovada', 'publicada'];
        if (!allowedStatuses.includes(status)) {
            throw new Error(`Status de aula inválido. Escolha entre: ${allowedStatuses.join(', ')}`);
        }

        const lesson = await LessonModel.findById(lessonId, db);
        if (!lesson) {
            throw new Error('Aula não encontrada.');
        }

        await LessonModel.updateStatus(lessonId, status, db);

        await AuditLogModel.log({
            usuario_id: adminUser.id,
            acao: 'REVISOU_AULA',
            detalhes: { lessonId, titulo: lesson.titulo, statusAnterior: lesson.status, statusNovo: status }
        }, db);

        return LessonModel.findById(lessonId, db);
    }
    static async listCourses(filters = {}, adminUser, db) {
        const courses = await CourseModel.listAll(filters, db);
        const enriched = await Promise.all(courses.map(async (c) => {
            const instrutores = await CourseModel.getInstructors(c.id, db);
            const modulos = await ModuleModel.findByCourse(c.id, db);
            return { ...c, instrutores, total_modulos: modulos.length };
        }));
        return enriched;
    }
    static async listAuditLogs(limit = 50, adminUser, db) {
        return AuditLogModel.listRecent(limit, db);
    }
}

module.exports = CourseAdminService;
