const express = require('express');
const router = express.Router();
const InstructorController = require('../controllers/instructor.controller');
const { authenticateToken, requireInstructorOrAdmin } = require('../middlewares/rbac.middleware');
router.use(authenticateToken);
router.use(requireInstructorOrAdmin);

router.get('/modules', InstructorController.listMyModules);
router.post('/lessons/draft', InstructorController.submitLessonDraft);
router.get('/modules/:id/lessons', InstructorController.getModuleLessons);

module.exports = router;
