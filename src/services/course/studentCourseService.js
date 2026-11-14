const CourseModel = require('../../models/CourseModel');
const ModuleModel = require('../../models/ModuleModel');
const LessonModel = require('../../models/LessonModel');

class StudentCourseService {
    static async listPublishedCourses(db) {
        const courses = await CourseModel.listAll({ status: 'publicado' }, db);
        const enriched = await Promise.all(courses.map(async (c) => {
            const instrutores = await CourseModel.getInstructors(c.id, db);
            const modulos = await ModuleModel.findByCourse(c.id, db);
            return {
                id: c.id,
                slug: c.slug,
                titulo: c.titulo,
                descricao: c.descricao,
                categoria: c.categoria,
                instrutores: instrutores.map(i => ({
                    nome: i.nome,
                    tipo_docente: i.tipo_docente,
                    bio_especifica: i.bio_especifica
                })),
                total_modulos: modulos.length
            };
        }));
        return enriched;
    }
    static async getCourseDetails(slug, currentUser = null, db) {
        const course = await CourseModel.findBySlug(slug, db);
        if (!course) {
            throw new Error('Curso não encontrado.');
        }

        const isAdmin = currentUser && currentUser.role === 'admin';
        if (course.status !== 'publicado' && !isAdmin) {
            throw new Error('Curso indisponível ou em preparação.');
        }

        const instrutores = await CourseModel.getInstructors(course.id, db);
        const modulos = await ModuleModel.findByCourse(course.id, db);

        const modulosComAulas = await Promise.all(modulos.map(async (m) => {
            const includeDrafts = isAdmin;
            const aulas = await LessonModel.findByModule(m.id, includeDrafts, db);
            return {
                id: m.id,
                titulo: m.titulo,
                ordem: m.ordem,
                instrutor: {
                    id: m.instrutor_responsavel_id,
                    nome: m.instrutor_nome
                },
                aulas: aulas.map(a => ({
                    id: a.id,
                    titulo: a.titulo,
                    video_url: a.video_url,
                    duracao_segundos: a.duracao_segundos,
                    material_apoio_url: a.material_apoio_url,
                    status: a.status,
                    ordem: a.ordem
                }))
            };
        }));

        return {
            id: course.id,
            slug: course.slug,
            titulo: course.titulo,
            descricao: course.descricao,
            categoria: course.categoria,
            status: course.status,
            instrutores: instrutores.map(i => ({
                id: i.instrutor_id,
                nome: i.nome,
                tipo_docente: i.tipo_docente,
                bio_especifica: i.bio_especifica
            })),
            modulos: modulosComAulas
        };
    }
}

module.exports = StudentCourseService;
