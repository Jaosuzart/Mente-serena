const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { buildDatabaseOptions } = require('../src/config/database-options');
const { initializeDatabase } = require('../src/config/initialize-database');
const { validateCheckoutInput, validateEmailOnly } = require('../src/middlewares/validateInput');
const { getPlan } = require('../src/config/plans');

function validate(middleware, body) {
    const result = { next: false };
    const res = {
        status(code) { result.status = code; return this; },
        json(payload) { result.payload = payload; return this; }
    };
    middleware({ body }, res, () => { result.next = true; });
    return result;
}

test('checkout mantém os quatro planos e normaliza os dados', () => {
    for (const plan of ['trial', 'mensal1', 'mensal2', 'mensal3']) {
        const body = { nome: '  Maria Silva ', email: ' MARIA@EXAMPLE.COM ', plan };
        assert.equal(validate(validateCheckoutInput, body).next, true);
        assert.equal(body.email, 'maria@example.com');
        assert.equal(body.nome, 'Maria Silva');
    }
    assert.deepEqual(['trial', 'mensal1', 'mensal2', 'mensal3'].map(id => getPlan(id).price), [30, 30, 50, 70]);
});

test('planos ausentes, objetos e nomes herdados são rejeitados', () => {
    for (const plan of [undefined, null, {}, [], 123, 'mensal99', '__proto__', 'constructor']) {
        assert.equal(validate(validateCheckoutInput, { nome: 'Maria', email: 'maria@example.com', plan }).status, 422);
    }
});

test('checkout rejeita cupons malformados antes de chamar integrações', () => {
    for (const cupom of [{}, [], 123, 'x'.repeat(51)]) {
        assert.equal(validate(validateCheckoutInput, { nome: 'Maria', email: 'maria@example.com', plan: 'mensal1', cupom }).status, 422);
    }
});

test('validação de email trata corpo ausente e limita tamanho', () => {
    for (const body of [undefined, {}, { email: 'inválido' }, { email: 'a'.repeat(255) + '@example.com' }]) {
        assert.equal(validate(validateEmailOnly, body).status, 422);
    }
});

test('configuração preserva caracteres especiais das credenciais e limita fila', () => {
    const config = buildDatabaseOptions({ DB_PASSWORD: 'a@b:c/#?', DB_SSL: 'false' });
    assert.equal(config.password, 'a@b:c/#?');
    assert.equal(config.ssl, undefined);
    assert.equal(config.connectionLimit, 10);
    assert.equal(config.queueLimit, 100);
    assert.equal(config.connectTimeout, 10000);
});

test('URL de conexão tem prioridade e limites são configuráveis', () => {
    const config = buildDatabaseOptions({ DATABASE_URL: 'mysql://localhost/example', DB_CONN_LIMIT: '3', DB_QUEUE_LIMIT: '7' });
    assert.equal(config.uri, 'mysql://localhost/example');
    assert.equal(config.connectionLimit, 3);
    assert.equal(config.queueLimit, 7);
});

test('configuração rejeita valores que tornariam recursos ilimitados ou inválidos', () => {
    for (const key of ['DB_CONN_LIMIT', 'DB_QUEUE_LIMIT', 'DB_CONNECT_TIMEOUT_MS', 'DB_PORT']) {
        for (const value of ['0', '-1', '1.5', '10abc', 'Infinity']) {
            assert.throws(() => buildDatabaseOptions({ [key]: value }), /inteiro positivo/);
        }
    }
});

test('inicialização prepara a tabela antes de inserir e propaga falhas', async () => {
    const queries = [];
    await initializeDatabase({ query: async sql => queries.push(sql) });
    assert.match(queries[0], /CREATE TABLE IF NOT EXISTS/);
    assert.match(queries[1], /INSERT IGNORE/);
    let calls = 0;
    await assert.rejects(initializeDatabase({ query: async () => { calls++; throw new Error('offline'); } }), /offline/);
    assert.equal(calls, 1);
});

// Importar a aplicação deve permitir testes sem conexão ao banco ou WhatsApp.
const pool = require('../src/config/database');
pool.query = async () => { throw new Error('Acesso externo não permitido neste teste'); };
const app = require('../src/app');
let server;
after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    await pool.end();
});

test('HTTP: página pública funciona e regras de servidor não são publicadas', async () => {
    server = await new Promise(resolve => {
        const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    assert.equal((await fetch(base + '/')).status, 200);
    for (const file of ['couponFilters', 'userFilters', 'paymentFilters']) {
        assert.equal((await fetch(`${base}/assets/filters/${file}.js`)).status, 404);
    }
    const response = await fetch(base + '/create_preference', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: 'Maria', email: 'maria@example.com', plan: 'inexistente' })
    });
    assert.equal(response.status, 422);
    const freeSpot = await fetch(base + '/claim_free_spot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
    });
    assert.equal(freeSpot.status, 422);
});
