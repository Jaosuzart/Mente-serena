const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { configurePayments } = require('../scripts/configure-payments');

test('configuração registra a URL pública e preserva o Worker e as outras variáveis', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mente-serena-payments-'));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const configPath = path.join(directory, 'wrangler.jsonc');
    const config = {
        name: 'mente-serena-web', main: 'src/cloudflare-worker.mjs', keep_vars: true,
        assets: { directory: './src/frontend', run_worker_first: ['/create_preference'] },
        vars: { EXISTING: 'preserved' },
    };
    fs.writeFileSync(configPath, JSON.stringify(config));
    assert.equal(configurePayments(' https://backend.example/ ', configPath), 'https://backend.example');
    assert.deepEqual(JSON.parse(fs.readFileSync(configPath, 'utf8')), {
        ...config, vars: { ...config.vars, BACKEND_URL: 'https://backend.example' },
    });
});

test('endereços incompletos ou que criariam um ciclo não alteram a configuração', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mente-serena-payments-'));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const configPath = path.join(directory, 'wrangler.jsonc');
    const original = '{"vars":{"BACKEND_URL":"https://existing.example"}}';
    fs.writeFileSync(configPath, original);
    for (const value of ['', 'invalid', 'http://backend.example', 'https://backend.example/create_preference',
        'https://user:secret@backend.example', 'https://backend.example/?token=secret', 'https://backend.example/#fragment',
        'https://localhost', 'https://127.0.0.1', 'https://[::1]',
        'https://mente-serena-web.suzartlimacastrojoaomarcelo.workers.dev/']) {
        assert.throws(() => configurePayments(value, configPath));
        assert.equal(fs.readFileSync(configPath, 'utf8'), original);
    }
});
