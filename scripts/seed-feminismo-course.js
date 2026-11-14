require('dotenv').config();
const pool = require('../src/config/database');
const { initializeCoursesDatabase } = require('../src/config/initialize-courses-database');
const PasswordHelper = require('../src/helpers/password.helper');
const CourseModel = require('../src/models/CourseModel');
const ModuleModel = require('../src/models/ModuleModel');
const LessonModel = require('../src/models/LessonModel');
const UserModel = require('../src/models/UserModel');
const AuditLogModel = require('../src/models/AuditLogModel');

async function seed() {
    console.log('🌱 [Seed] Inicializando tabelas do sistema de cursos...');
    await initializeCoursesDatabase(pool);
    console.log('✅ [Seed] Tabelas verificadas/criadas com sucesso.');

    // 1. Cadastrar Administrador Geral & Instrutor Titular: João Marcelo
    let joao = await UserModel.findByEmail('joao.marcelo@menteserena.life', pool);
    if (!joao) {
        const hash = PasswordHelper.hashPassword('Admin@MenteSerena2026!');
        const joaoId = await UserModel.create({
            nome: 'João Marcelo',
            email: 'joao.marcelo@menteserena.life',
            senha_hash: hash,
            role: 'admin'
        }, pool);
        joao = await UserModel.findById(joaoId, pool);
        console.log(`✅ [Seed] Administrador João Marcelo cadastrado com ID: ${joaoId}`);
    }

    // 2. Cadastrar Instrutor: Luan Castro
    let luan = await UserModel.findByEmail('luan.castro@menteserena.life', pool);
    if (!luan) {
        const hash = PasswordHelper.hashPassword('Luan@Instrutor2026!');
        const luanId = await UserModel.create({
            nome: 'Luan Castro',
            email: 'luan.castro@menteserena.life',
            senha_hash: hash,
            role: 'instrutor'
        }, pool);
        luan = await UserModel.findById(luanId, pool);
        console.log(`✅ [Seed] Instrutor Luan Castro cadastrado com ID: ${luanId}`);
    }

    // 3. Cadastrar Instrutor: Nilton Lima Filho
    let nilton = await UserModel.findByEmail('nilton.lima@menteserena.life', pool);
    if (!nilton) {
        const hash = PasswordHelper.hashPassword('Nilton@Instrutor2026!');
        const niltonId = await UserModel.create({
            nome: 'Nilton Lima Filho',
            email: 'nilton.lima@menteserena.life',
            senha_hash: hash,
            role: 'instrutor'
        }, pool);
        nilton = await UserModel.findById(niltonId, pool);
        console.log(`✅ [Seed] Instrutor Nilton Lima Filho cadastrado com ID: ${niltonId}`);
    }

    // 4. Cadastrar Instrutor Convidado: Eliseu
    let eliseu = await UserModel.findByEmail('eliseu@menteserena.life', pool);
    if (!eliseu) {
        const hash = PasswordHelper.hashPassword('Eliseu@Instrutor2026!');
        const eliseuId = await UserModel.create({
            nome: 'Eliseu',
            email: 'eliseu@menteserena.life',
            senha_hash: hash,
            role: 'instrutor'
        }, pool);
        eliseu = await UserModel.findById(eliseuId, pool);
        console.log(`✅ [Seed] Instrutor Eliseu cadastrado com ID: ${eliseuId}`);
    }

    // 5. Cadastrar Curso Mente Serena / Consciência
    const courseSlug = 'mente-serena-formacao-completa';
    let curso = await CourseModel.findBySlug(courseSlug, pool);
    if (!curso) {
        const cursoId = await CourseModel.create({
            slug: courseSlug,
            titulo: 'Mente Serena: Formação Completa em Inteligência Emocional e Bem-Estar',
            descricao: 'Formação completa integrando inteligência emocional, regulação somática, comunicação assertiva e filosofia social.',
            categoria: 'Desenvolvimento Humano & Bem-Estar',
            admin_id: joao.id,
            status: 'publicado'
        }, pool);
        curso = await CourseModel.findById(cursoId, pool);
        console.log(`✅ [Seed] Curso cadastrado (ID: ${cursoId}, Administrador Geral: João Marcelo)`);
    }

    // 6. Vincular os 4 Instrutores ao Curso
    await CourseModel.assignInstructor({
        curso_id: curso.id,
        instrutor_id: joao.id,
        tipo_docente: 'titular',
        bio_especifica: 'Fundador e coordenador. Módulo 1: Inteligência Emocional, Pausa Consciente e Foco.'
    }, pool);

    await CourseModel.assignInstructor({
        curso_id: curso.id,
        instrutor_id: luan.id,
        tipo_docente: 'titular',
        bio_especifica: 'Facilitador em saúde integrativa. Módulo 2: O Corpo em Harmonia e Fisiologia da Calma.'
    }, pool);

    await CourseModel.assignInstructor({
        curso_id: curso.id,
        instrutor_id: nilton.id,
        tipo_docente: 'titular',
        bio_especifica: 'Mentor comportamental. Módulo 3: Autoliderança, Limites e Relações Saudáveis.'
    }, pool);

    await CourseModel.assignInstructor({
        curso_id: curso.id,
        instrutor_id: eliseu.id,
        tipo_docente: 'convidado',
        bio_especifica: 'Instrutor convidado. Módulo Bônus: Filosofia Social, Consciência e Sociedade.'
    }, pool);
    console.log('✅ [Seed] Todos os 4 instrutores vinculados com suas especialidades.');

    // 7. Criar os Módulos de cada Instrutor
    const modulosExistentes = await ModuleModel.findByCourse(curso.id, pool);

    // Módulo 1 - João Marcelo
    let modJoao = modulosExistentes.find(m => m.instrutor_responsavel_id === joao.id);
    if (!modJoao) {
        const modId = await ModuleModel.create({
            curso_id: curso.id,
            instrutor_responsavel_id: joao.id,
            titulo: 'Módulo 1: Inteligência Emocional e Foco no Caos',
            ordem: 1
        }, pool);
        modJoao = await ModuleModel.findById(modId, pool);
        await LessonModel.create({ modulo_id: modId, titulo: 'Mapeamento de gatilhos: identificando o que drena sua energia', duracao_segundos: 720, status: 'publicada', ordem: 1 }, pool);
        await LessonModel.create({ modulo_id: modId, titulo: 'A pausa consciente e a resposta intencional', duracao_segundos: 900, status: 'publicada', ordem: 2 }, pool);
        await LessonModel.create({ modulo_id: modId, titulo: 'Foco afunilado: eliminando o excesso de ruído mental', duracao_segundos: 840, status: 'publicada', ordem: 3 }, pool);
        await LessonModel.create({ modulo_id: modId, titulo: 'Roteiro prático de clareza mental para decisões difíceis', duracao_segundos: 960, status: 'publicada', ordem: 4 }, pool);
        console.log('✅ [Seed] Módulo 1 (João Marcelo) e aulas criadas.');
    }

    // Módulo 2 - Luan Castro
    let modLuan = modulosExistentes.find(m => m.instrutor_responsavel_id === luan.id);
    if (!modLuan) {
        const modId = await ModuleModel.create({
            curso_id: curso.id,
            instrutor_responsavel_id: luan.id,
            titulo: 'Módulo 2: O Corpo em Harmonia e Fisiologia da Calma',
            ordem: 2
        }, pool);
        modLuan = await ModuleModel.findById(modId, pool);
        await LessonModel.create({ modulo_id: modId, titulo: 'A neurobiologia do estresse e da tranquilidade', duracao_segundos: 840, status: 'publicada', ordem: 1 }, pool);
        await LessonModel.create({ modulo_id: modId, titulo: 'Protocolos respiratórios para alívio imediato da ansiedade', duracao_segundos: 960, status: 'publicada', ordem: 2 }, pool);
        await LessonModel.create({ modulo_id: modId, titulo: 'Higiene do sono e desconexão da mente noturna', duracao_segundos: 900, status: 'publicada', ordem: 3 }, pool);
        await LessonModel.create({ modulo_id: modId, titulo: 'Micropausas de descompressão na rotina de trabalho', duracao_segundos: 720, status: 'publicada', ordem: 4 }, pool);
        console.log('✅ [Seed] Módulo 2 (Luan Castro) e aulas criadas.');
    }

    // Módulo 3 - Nilton Lima Filho
    let modNilton = modulosExistentes.find(m => m.instrutor_responsavel_id === nilton.id);
    if (!modNilton) {
        const modId = await ModuleModel.create({
            curso_id: curso.id,
            instrutor_responsavel_id: nilton.id,
            titulo: 'Módulo 3: Autoliderança, Limites e Relações Saudáveis',
            ordem: 3
        }, pool);
        modNilton = await ModuleModel.findById(modId, pool);
        await LessonModel.create({ modulo_id: modId, titulo: 'A arte de estabelecer limites saudáveis sem culpa', duracao_segundos: 900, status: 'publicada', ordem: 1 }, pool);
        await LessonModel.create({ modulo_id: modId, titulo: 'Comunicação assertiva e desarmando conflitos', duracao_segundos: 1080, status: 'publicada', ordem: 2 }, pool);
        await LessonModel.create({ modulo_id: modId, titulo: 'Gestão da autoexigência e da cobrança interna', duracao_segundos: 840, status: 'publicada', ordem: 3 }, pool);
        await LessonModel.create({ modulo_id: modId, titulo: 'Plano individual de sustentabilidade emocional', duracao_segundos: 1020, status: 'publicada', ordem: 4 }, pool);
        console.log('✅ [Seed] Módulo 3 (Nilton Lima Filho) e aulas criadas.');
    }

    // Módulo 4 - Eliseu (Instrutor Convidado / Bônus)
    let modEliseu = modulosExistentes.find(m => m.instrutor_responsavel_id === eliseu.id);
    if (!modEliseu) {
        const modId = await ModuleModel.create({
            curso_id: curso.id,
            instrutor_responsavel_id: eliseu.id,
            titulo: 'Módulo Especial: Filosofia Social, Consciência e Sociedade (Bônus)',
            ordem: 4
        }, pool);
        modEliseu = await ModuleModel.findById(modId, pool);
        await LessonModel.create({ modulo_id: modId, titulo: 'Propósito, pensamento crítico e autonomia interior', duracao_segundos: 1080, status: 'publicada', ordem: 1 }, pool);
        await LessonModel.create({ modulo_id: modId, titulo: 'Mulheres, sociedade e a desconstrução de padrões', duracao_segundos: 1200, status: 'publicada', ordem: 2 }, pool);
        await LessonModel.create({ modulo_id: modId, titulo: 'Sabedoria prática para o florescimento pessoal', duracao_segundos: 960, status: 'em_revisao', ordem: 3 }, pool);
        console.log('✅ [Seed] Módulo Bônus (Eliseu) e aulas criadas.');
    }

    await AuditLogModel.log({
        usuario_id: joao.id,
        acao: 'SEED_SISTEMA_INSTRUTORES_COMPLETO',
        detalhes: { courseSlug, adminId: joao.id, totalInstrutores: 4 }
    }, pool);

    console.log('🎉 [Seed] Todos os módulos dos 4 instrutores configurados com sucesso!');
}

if (require.main === module) {
    seed().then(async () => {
        await pool.end();
        process.exit(0);
    }).catch(async (err) => {
        console.error('❌ [Seed] Erro:', err);
        await pool.end();
        process.exit(1);
    });
}

module.exports = { seed };
