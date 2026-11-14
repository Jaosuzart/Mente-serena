const CourseAdminService = require('../services/course/courseAdminService');
const ResponseHelper = require('../helpers/response.helper');

class CourseAdminController {
    static async createCourse(req, res) {
        try {
            const { slug, titulo, descricao, categoria, status } = req.body || {};
            const course = await CourseAdminService.createCourse(
                { slug, titulo, descricao, categoria, status },
                req.user
            );
            return ResponseHelper.success(res, course, 'Curso criado com sucesso pelo Administrador.', 201);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400, error);
        }
    }

    static async assignInstructor(req, res) {
        try {
            const { id } = req.params;
            const { instrutorId, tipoDocente, bioEspecifica } = req.body || {};
            const instructors = await CourseAdminService.assignInstructor(
                { cursoId: id, instrutorId, tipoDocente, bioEspecifica },
                req.user
            );
            return ResponseHelper.success(res, instructors, 'Instrutor vinculado ao curso com sucesso.');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400, error);
        }
    }

    static async updateCourseStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body || {};
            const updated = await CourseAdminService.updateCourseStatus(id, status, req.user);
            return ResponseHelper.success(res, updated, 'Status do curso atualizado com sucesso.');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400, error);
        }
    }

    static async createModule(req, res) {
        try {
            const { id } = req.params; // cursoId
            const { instrutorId, titulo, ordem } = req.body || {};
            const modulo = await CourseAdminService.createModule(
                { cursoId: id, instrutorId, titulo, ordem },
                req.user
            );
            return ResponseHelper.success(res, modulo, 'Módulo criado com sucesso.', 201);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400, error);
        }
    }

    static async reviewLesson(req, res) {
        try {
            const { id } = req.params; // lessonId
            const { status } = req.body || {};
            const updated = await CourseAdminService.reviewLesson(id, status, req.user);
            return ResponseHelper.success(res, updated, `Aula revisada com sucesso. Novo status: ${status}`);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400, error);
        }
    }

    static async listCourses(req, res) {
        try {
            const { status, categoria } = req.query || {};
            const courses = await CourseAdminService.listCourses({ status, categoria }, req.user);
            return ResponseHelper.success(res, courses);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400, error);
        }
    }

    static async listAuditLogs(req, res) {
        try {
            const { limit } = req.query || {};
            const logs = await CourseAdminService.listAuditLogs(limit, req.user);
            return ResponseHelper.success(res, logs);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400, error);
        }
    }
}

module.exports = CourseAdminController;
