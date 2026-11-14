async function initializeCoursesDatabase(pool) {
    await pool.query(`CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(120) NOT NULL,
        email VARCHAR(254) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'instrutor', 'aluno') NOT NULL DEFAULT 'aluno',
        ativo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_email (email),
        INDEX idx_user_role (role)
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS cursos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        titulo VARCHAR(150) NOT NULL,
        descricao TEXT,
        categoria VARCHAR(60) NOT NULL,
        status ENUM('rascunho', 'publicado', 'arquivado') NOT NULL DEFAULT 'rascunho',
        admin_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_curso_admin (admin_id),
        INDEX idx_curso_slug (slug),
        INDEX idx_curso_status (status)
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS curso_instrutores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        curso_id INT NOT NULL,
        instrutor_id INT NOT NULL,
        tipo_docente ENUM('titular', 'co_instrutor', 'convidado') NOT NULL DEFAULT 'titular',
        bio_especifica TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_curso_instrutor (curso_id, instrutor_id),
        INDEX idx_ci_curso (curso_id),
        INDEX idx_ci_instrutor (instrutor_id)
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS modulos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        curso_id INT NOT NULL,
        instrutor_responsavel_id INT NOT NULL,
        titulo VARCHAR(120) NOT NULL,
        ordem INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_mod_curso (curso_id),
        INDEX idx_mod_instrutor (instrutor_responsavel_id)
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS aulas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        modulo_id INT NOT NULL,
        titulo VARCHAR(150) NOT NULL,
        video_url VARCHAR(255),
        duracao_segundos INT DEFAULT 0,
        material_apoio_url VARCHAR(255),
        status ENUM('em_revisao', 'aprovada', 'publicada') NOT NULL DEFAULT 'em_revisao',
        ordem INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_aula_modulo (modulo_id),
        INDEX idx_aula_status (status)
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS matriculas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        curso_id INT NOT NULL,
        status ENUM('ativa', 'cancelada', 'pendente') NOT NULL DEFAULT 'ativa',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_usuario_curso (usuario_id, curso_id),
        INDEX idx_matr_usuario (usuario_id),
        INDEX idx_matr_curso (curso_id)
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        acao VARCHAR(100) NOT NULL,
        detalhes TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_usuario (usuario_id),
        INDEX idx_audit_acao (acao)
    )`);
}

module.exports = { initializeCoursesDatabase };
