const InstructorService = require('../services/course/instructorService');
const ResponseHelper = require('../helpers/response.helper');

class InstructorController {
    static async listMyModules(req, res) {
        try {
            const modules = await InstructorService.listMyModules(req.user);
            return ResponseHelper.success(res, modules);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400, error);
        }
    }

    static async submitLessonDraft(req, res) {
        try {
            const { moduloId, titulo, videoUrl, duracaoSegundos, materialApoioUrl, ordem } = req.body || {};
            const lesson = await InstructorService.submitLessonDraft({
                moduloId,
                titulo,
                videoUrl,
                duracaoSegundos,
                materialApoioUrl,
                ordem
            }, req.user);
            return ResponseHelper.success(res, lesson, 'Rascunho de aula enviado com sucesso para revisão do Administrador.', 201);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400, error);
        }
    }

    static async getModuleLessons(req, res) {
        try {
            const { id } = req.params; // moduloId
            const lessons = await InstructorService.getModuleLessons(id, req.user);
            return ResponseHelper.success(res, lessons);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400, error);
        }
    }
}

module.exports = InstructorController;
