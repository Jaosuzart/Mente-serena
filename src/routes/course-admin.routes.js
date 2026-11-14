const express = require('express');
const router = express.Router();
const CourseAdminController = require('../controllers/course-admin.controller');
const { authenticateToken, requireAdmin } = require('../middlewares/rbac.middleware');

router.use(authenticateToken);
router.use(requireAdmin);

router.post('/', CourseAdminController.createCourse);
router.get('/', CourseAdminController.listCourses);
router.post('/:id/instructors', CourseAdminController.assignInstructor);
router.patch('/:id/status', CourseAdminController.updateCourseStatus);
router.post('/:id/modules', CourseAdminController.createModule);
router.patch('/lessons/:id/review', CourseAdminController.reviewLesson);
router.get('/audit-logs', CourseAdminController.listAuditLogs);

module.exports = router;
