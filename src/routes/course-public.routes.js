const express = require('express');
const router = express.Router();
const CoursePublicController = require('../controllers/course-public.controller');
const JwtHelper = require('../helpers/jwt.helper');
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = JwtHelper.verifyToken(token);
        if (decoded) {
            req.user = {
                id: decoded.id || decoded.userId,
                email: decoded.email,
                role: decoded.role || 'aluno'
            };
        }
    }
    next();
}

router.use(optionalAuth);

router.get('/', CoursePublicController.listCourses);
router.get('/:slug', CoursePublicController.getCourseDetails);

module.exports = router;
