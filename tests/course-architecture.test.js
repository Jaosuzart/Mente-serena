const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const JwtHelper = require('JwtHelper');
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-12345678901234567890';
const JwtHelper = require('../src/helpers/jwt.helper');
const { requireRole, requireAdmin, requireInstructorOrAdmin, authenticateToken } = require('../src/middlewares/rbac.middleware');
const CourseAdminService = require('../src/services/course/courseAdminService');
const InstructorService = require('../src/services/course/instructorService');
const StudentCourseService = require('../src/services/course/studentCourseService');
function createInMemoryDb() {
    const db = {
        usuarios: [
            { id: 1, nome: 'João Marcelo', email: 'joao.marcelo@menteserena.life', role: 'admin' },
            { id: 2, nome: 'Eliseu', email: 'eliseu@menteserena.life', role: 'instrutor' },
            { id: 3, nome: 'Aluna Teste', email: 'aluna@exemplo.com', role: 'aluno' }
        ],
        cursos: [],
        curso_instrutores: [],
        modulos: [],
        aulas: [],
        audit_logs: [],

        async query(sql, params = []) {
            const cleanSql = sql.replace(/\s+/g, ' ').trim();
            if (cleanSql.startsWith('INSERT INTO cursos')) {
                const id = db.cursos.length + 1;
                const [slug, titulo, descricao, categoria, admin_id, status] = params;
                db.cursos.push({ id, slug, titulo, descricao, categoria, admin_id, status, created_at: new Date() });
                return [{ insertId: id }];
            }
            if (cleanSql.includes('FROM cursos c') && cleanSql.includes('WHERE c.slug = ?')) {
                const slug = params[0];
                const found = db.cursos.find(c => c.slug === slug);
                if (!found) return [[]];
                const admin = db.usuarios.find(u => u.id === found.admin_id);
                return [[{ ...found, admin_nome: admin ? admin.nome : '' }]];
            }
            if (cleanSql.includes('FROM cursos c') && cleanSql.includes('WHERE c.id = ?')) {
                const id = parseInt(params[0], 10);
                const found = db.cursos.find(c => c.id === id);
                if (!found) return [[]];
                const admin = db.usuarios.find(u => u.id === found.admin_id);
                return [[{ ...found, admin_nome: admin ? admin.nome : '' }]];
            }
            if (cleanSql.startsWith('SELECT c.*, u.nome AS admin_nome FROM cursos c')) {
                let list = [...db.cursos];
                if (params.includes('publicado')) {
                    list = list.filter(c => c.status === 'publicado');
                }
                const enriched = list.map(c => {
                    const admin = db.usuarios.find(u => u.id === c.admin_id);
                    return { ...c, admin_nome: admin ? admin.nome : '' };
                });
                return [enriched];
            }
            if (cleanSql.startsWith('UPDATE cursos SET status = ?')) {
                const [status, id] = params;
                const found = db.cursos.find(c => c.id === parseInt(id, 10));
                if (found) {
                    found.status = status;
                    return [{ affectedRows: 1 }];
                }
                return [{ affectedRows: 0 }];
            }
            if (cleanSql.startsWith('SELECT id, nome, email, role') && cleanSql.includes('WHERE id = ?')) {
                const id = parseInt(params[0], 10);
                const user = db.usuarios.find(u => u.id === id);
                return user ? [[user]] : [[]];
            }
            if (cleanSql.startsWith('INSERT INTO curso_instrutores')) {
                const [curso_id, instrutor_id, tipo_docente, bio_especifica] = params;
                const id = db.curso_instrutores.length + 1;
                db.curso_instrutores.push({ id, curso_id: parseInt(curso_id, 10), instrutor_id: parseInt(instrutor_id, 10), tipo_docente, bio_especifica });
                return [{ insertId: id }];
            }
            if (cleanSql.includes('FROM curso_instrutores ci')) {
                const cursoId = parseInt(params[0], 10);
                const vinculados = db.curso_instrutores
                    .filter(ci => ci.curso_id === cursoId)
                    .map(ci => {
                        const u = db.usuarios.find(user => user.id === ci.instrutor_id);
                        return {
                            vinculo_id: ci.id,
                            tipo_docente: ci.tipo_docente,
                            bio_especifica: ci.bio_especifica,
                            instrutor_id: ci.instrutor_id,
                            nome: u ? u.nome : '',
                            email: u ? u.email : '',
                            role: u ? u.role : ''
                        };
                    });
                return [vinculados];
            }

            if (cleanSql.startsWith('INSERT INTO modulos')) {
                const [curso_id, instrutor_responsavel_id, titulo, ordem] = params;
                const id = db.modulos.length + 1;
                db.modulos.push({ id, curso_id: parseInt(curso_id, 10), instrutor_responsavel_id: parseInt(instrutor_responsavel_id, 10), titulo, ordem });
                return [{ insertId: id }];
            }
            if (cleanSql.includes('FROM modulos m') && cleanSql.includes('WHERE m.id = ?')) {
                const id = parseInt(params[0], 10);
                const m = db.modulos.find(mod => mod.id === id);
                if (!m) return [[]];
                const u = db.usuarios.find(user => user.id === m.instrutor_responsavel_id);
                return [[{ ...m, instrutor_nome: u ? u.nome : '' }]];
            }

            if (cleanSql.includes('FROM modulos m') && cleanSql.includes('WHERE m.curso_id = ?')) {
                const cursoId = parseInt(params[0], 10);
                const mods = db.modulos.filter(m => m.curso_id === cursoId).map(m => {
                    const u = db.usuarios.find(user => user.id === m.instrutor_responsavel_id);
                    return { ...m, instrutor_nome: u ? u.nome : '' };
                });
                return [mods];
            }

            if (cleanSql.includes('WHERE m.instrutor_responsavel_id = ?')) {
                const instrutorId = parseInt(params[0], 10);
                const mods = db.modulos.filter(m => m.instrutor_responsavel_id === instrutorId).map(m => {
                    const c = db.cursos.find(cur => cur.id === m.curso_id);
                    return { ...m, curso_titulo: c ? c.titulo : '', curso_slug: c ? c.slug : '' };
                });
                return [mods];
            }
            if (cleanSql.startsWith('INSERT INTO aulas')) {
                const [modulo_id, titulo, video_url, duracao_segundos, material_apoio_url, status, ordem] = params;
                const id = db.aulas.length + 1;
                db.aulas.push({
                    id,
                    modulo_id: parseInt(modulo_id, 10),
                    titulo,
                    video_url,
                    duracao_segundos,
                    material_apoio_url,
                    status,
                    ordem
                });
                return [{ insertId: id }];
            }
            if (cleanSql.includes('FROM aulas a') && cleanSql.includes('WHERE a.id = ?')) {
                const id = parseInt(params[0], 10);
                const aula = db.aulas.find(a => a.id === id);
                if (!aula) return [[]];
                const m = db.modulos.find(mod => mod.id === aula.modulo_id);
                const c = m ? db.cursos.find(cur => cur.id === m.curso_id) : null;
                return [[{
                    ...aula,
                    modulo_titulo: m ? m.titulo : '',
                    curso_id: m ? m.curso_id : null,
                    instrutor_responsavel_id: m ? m.instrutor_responsavel_id : null,
                    admin_id: c ? c.admin_id : null
                }]];
            }
            if (cleanSql.startsWith('SELECT * FROM aulas WHERE modulo_id = ?')) {
                const moduloId = parseInt(params[0], 10);
                let list = db.aulas.filter(a => a.modulo_id === moduloId);
                if (cleanSql.includes("status = 'publicada'")) {
                    list = list.filter(a => a.status === 'publicada');
                }
                return [list];
            }
            if (cleanSql.startsWith('UPDATE aulas SET status = ?')) {
                const [status, id] = params;
                const aula = db.aulas.find(a => a.id === parseInt(id, 10));
                if (aula) {
                    aula.status = status;
                    return [{ affectedRows: 1 }];
                }
                return [{ affectedRows: 0 }];
            }
            if (cleanSql.startsWith('INSERT INTO audit_logs')) {
                const [usuario_id, acao, detalhes, ip_address] = params;
                const id = db.audit_logs.length + 1;
                db.audit_logs.push({ id, usuario_id, acao, detalhes, ip_address, created_at: new Date() });
                return [{ insertId: id }];
            }
            if (cleanSql.includes('FROM audit_logs a')) {
                return [[...db.audit_logs]];
            }

            return [[]];
        }
    };
    return db;
}
test('RBAC: Bloqueia acesso sem token de autenticação', () => {
    let statusCode = null;
    let jsonBody = null;
    const req = { headers: {} };
    const res = {
        status(code) { statusCode = code; return this; },
        json(data) { jsonBody = data; return this; }
    };
    authenticateToken(req, res, () => {});
    assert.equal(statusCode, 401);
    assert.equal(jsonBody.success, false);
});

test('RBAC: Bloqueia perfil ALUNO de rotas de ADMIN (403)', () => {
    let statusCode = null;
    let jsonBody = null;
    const req = { user: { id: 3, role: 'aluno', nome: 'Aluna' } };
    const res = {
        status(code) { statusCode = code; return this; },
        json(data) { jsonBody = data; return this; }
    };
    requireAdmin(req, res, () => {});
    assert.equal(statusCode, 403);
    assert.match(jsonBody.message, /Acesso negado/);
});

test('RBAC: Bloqueia perfil INSTRUTOR de rotas de ADMIN (403)', () => {
    let statusCode = null;
    let jsonBody = null;
    const req = { user: { id: 2, role: 'instrutor', nome: 'Eliseu' } };
    const res = {
        status(code) { statusCode = code; return this; },
        json(data) { jsonBody = data; return this; }
    };
    requireAdmin(req, res, () => {});
    assert.equal(statusCode, 403);
    assert.match(jsonBody.message, /operação restrita a \[admin\]/);
});

test('RBAC: Permite ADMIN em rotas administrativas', () => {
    let nextCalled = false;
    const req = { user: { id: 1, role: 'admin', nome: 'João Marcelo' } };
    const res = {};
    requireAdmin(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
});

test('RBAC: Permite INSTRUTOR e ADMIN em rotas docentes', () => {
    let eliseuAllowed = false;
    let joaoAllowed = false;
    requireInstructorOrAdmin({ user: { id: 2, role: 'instrutor' } }, {}, () => { eliseuAllowed = true; });
    requireInstructorOrAdmin({ user: { id: 1, role: 'admin' } }, {}, () => { joaoAllowed = true; });
    assert.equal(eliseuAllowed, true);
    assert.equal(joaoAllowed, true);
});

test('Arquitetura de Cursos: João Marcelo administra o curso de feminismo ministrado com Eliseu', async () => {
    const db = createInMemoryDb();
    const joaoAdmin = { id: 1, nome: 'João Marcelo', role: 'admin' };
    const eliseuInstrutor = { id: 2, nome: 'Eliseu', role: 'instrutor' };
    const curso = await CourseAdminService.createCourse({
        slug: 'feminismo-consciencia-mulheres',
        titulo: 'Feminismo, Consciência e Mente Serena',
        categoria: 'Feminismo',
        status: 'publicado'
    }, joaoAdmin, db);

    assert.equal(curso.slug, 'feminismo-consciencia-mulheres');
    assert.equal(curso.admin_id, 1); // João é o administrador gravado no banco
    await CourseAdminService.assignInstructor({
        cursoId: curso.id,
        instrutorId: joaoAdmin.id,
        tipoDocente: 'titular',
        bioEspecifica: 'Administrador geral e instrutor de inteligência emocional.'
    }, joaoAdmin, db);

    await CourseAdminService.assignInstructor({
        cursoId: curso.id,
        instrutorId: eliseuInstrutor.id,
        tipoDocente: 'co_instrutor',
        bioEspecifica: 'Instrutor convidado de filosofia social.'
    }, joaoAdmin, db);

    const modJoao = await CourseAdminService.createModule({
        cursoId: curso.id,
        instrutorId: joaoAdmin.id,
        titulo: 'Módulo 1: Autonomia e Foco',
        ordem: 1
    }, joaoAdmin, db);

    const modEliseu = await CourseAdminService.createModule({
        cursoId: curso.id,
        instrutorId: eliseuInstrutor.id,
        titulo: 'Módulo 2: Filosofia e Consciência Social',
        ordem: 2
    }, joaoAdmin, db);

    assert.equal(modJoao.instrutor_responsavel_id, 1);
    assert.equal(modEliseu.instrutor_responsavel_id, 2);

    // 4. Eliseu tenta submeter aula no módulo do João -> DEVE FALHAR (isolamento)
    await assert.rejects(
        InstructorService.submitLessonDraft({
            moduloId: modJoao.id,
            titulo: 'Intrusão indevida'
        }, eliseuInstrutor, db),
        /Permissão negada: você só pode submeter aulas nos módulos sob sua responsabilidade/
    );
    const aulaEliseu = await InstructorService.submitLessonDraft({
        moduloId: modEliseu.id,
        titulo: 'A história do movimento feminino',
        duracaoSegundos: 1200
    }, eliseuInstrutor, db);

    assert.equal(aulaEliseu.status, 'em_revisao'); // Gatekeeper ativo: não publicada imediatamente!

    const detalhesAntesAprovacao = await StudentCourseService.getCourseDetails('feminismo-consciencia-mulheres', null, db);
    const modEliseuPublico = detalhesAntesAprovacao.modulos.find(m => m.id === modEliseu.id);
    assert.equal(modEliseuPublico.aulas.length, 0); // Oculta para o público

    const aulaAprovada = await CourseAdminService.reviewLesson(aulaEliseu.id, 'publicada', joaoAdmin, db);
    assert.equal(aulaAprovada.status, 'publicada');

    const detalhesAposAprovacao = await StudentCourseService.getCourseDetails('feminismo-consciencia-mulheres', null, db);
    const modEliseuPublicoAprovado = detalhesAposAprovacao.modulos.find(m => m.id === modEliseu.id);
    assert.equal(modEliseuPublicoAprovado.aulas.length, 1);
    assert.equal(modEliseuPublicoAprovado.aulas[0].titulo, 'A história do movimento feminino');

    const auditLogs = await CourseAdminService.listAuditLogs(10, joaoAdmin, db);
    assert.ok(auditLogs.length >= 4);
    assert.ok(auditLogs.some(log => log.acao === 'CRIOU_CURSO'));
    assert.ok(auditLogs.some(log => log.acao === 'SUBMETEU_RASCUNHO_AULA'));
    assert.ok(auditLogs.some(log => log.acao === 'REVISOU_AULA'));
});
