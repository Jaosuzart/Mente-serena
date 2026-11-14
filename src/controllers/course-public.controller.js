const StudentCourseService = require('../services/course/studentCourseService');
const ResponseHelper = require('../helpers/response.helper');

class CoursePublicController {
    static async listCourses(req, res) {
        try {
            const courses = await StudentCourseService.listPublishedCourses();
            return ResponseHelper.success(res, courses);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400, error);
        }
    }

    static async getCourseDetails(req, res) {
        try {
            const { slug } = req.params;
            const course = await StudentCourseService.getCourseDetails(slug, req.user || null);
            return ResponseHelper.success(res, course);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 404, error);
        }
    }
}

module.exports = CoursePublicController;
