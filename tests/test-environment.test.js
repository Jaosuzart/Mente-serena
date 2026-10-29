const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validateTestEnvironment, loadTestEnvironment } = require('../src/config/test-environment');
const valid = { NODE_ENV: 'test', WHATSAPP_ENABLED: 'false', DB_HOST: 'localhost', DB_USER: 'tester', DB_PASSWORD: 'example-password', DB_NAME: 'tests', MP_ACCESS_TOKEN: 'example-token' };

test('configuração de teste exige credenciais e modo de teste explícitos', () => {
    for (const key of Object.keys(valid)) {
        const env = { ...valid };
        delete env[key];
        assert.throws(() => validateTestEnvironment(env), /Configure .env.test.local/);
    }
});

test('configuração de teste não expõe segredos nas mensagens de erro', () => {
    assert.throws(() => validateTestEnvironment({ ...valid, DATABASE_URL: 'mysql://secret:password@' }), error => {
        assert.match(error.message, /DATABASE_URL/);
        assert.doesNotMatch(error.message, /secret|password|example-token/);
        return true;
    });
});

test('arquivo de teste obrigatório não recorre à configuração principal', () => {
    assert.throws(() => loadTestEnvironment(path.join(os.tmpdir(), 'absent-' + require('node:crypto').randomUUID())), /Crie .env.test.local/);
});

test('configuração lida do arquivo ignora credenciais herdadas do processo', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mente-serena-test-'));
    const file = path.join(directory, '.env.test.local');
    const previous = process.env.DATABASE_URL;
    try {
        process.env.DATABASE_URL = 'mysql://production:secret@production.invalid/live';
        fs.writeFileSync(file, Object.entries(valid).map(([key, value]) => `${key}=${value}`).join('\n'));
        const config = loadTestEnvironment(file);
        assert.equal(config.database.host, 'localhost');
        assert.equal(config.database.uri, undefined);
        assert.equal(config.accessToken, 'example-token');
    } finally {
        if (previous === undefined) delete process.env.DATABASE_URL;
        else process.env.DATABASE_URL = previous;
        fs.unlinkSync(file);
        fs.rmdirSync(directory);
    }
});

test('URL MySQL de teste pode substituir campos separados', () => {
    const config = validateTestEnvironment({ NODE_ENV: 'test', WHATSAPP_ENABLED: 'false', DATABASE_URL: 'mysql://tester:example@localhost/tests', MP_ACCESS_TOKEN: 'example' });
    assert.equal(config.database.uri, 'mysql://tester:example@localhost/tests');
});
