const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function loadApi(fetch) {
    const context = vm.createContext({ fetch });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/frontend/js/api.js'), 'utf8'), context);
    return context.MenteSerenaApi;
}

test('404 vazio informa indisponibilidade sem tentar ler JSON', async () => {
    const api = loadApi(async () => ({ status: 404, json() { assert.fail('não deve ler JSON'); } }));
    await assert.rejects(api.post('/create_preference', {}), /indisponível \(404\)/);
});

test('resposta HTML ou vazia informa resposta inválida', async () => {
    for (const status of [200, 502]) {
        const api = loadApi(async () => ({ status, json() { throw new SyntaxError('invalid JSON'); } }));
        await assert.rejects(api.post('/create_preference', {}), new RegExp(`HTTP ${status}`));
    }
});

test('API externa recebe o pedido e preserva erros JSON de negócio', async () => {
    const api = loadApi(async (url, options) => {
        assert.equal(url, 'https://api.example.com/create_preference');
        assert.equal(options.method, 'POST');
        assert.deepEqual(JSON.parse(options.body), { plan: 'mensal1' });
        return { status: 422, ok: false, json: async () => ({ error: 'Plano inválido.' }) };
    });
    api.baseUrl = 'https://api.example.com/';
    const { response, data } = await api.post('/create_preference', { plan: 'mensal1' });
    assert.equal(response.ok, false);
    assert.equal(data.error, 'Plano inválido.');
});

test('JSON sem objeto de resposta é rejeitado', async () => {
    for (const data of [null, [], 'ok', 42]) {
        const api = loadApi(async () => ({ status: 200, ok: true, json: async () => data }));
        await assert.rejects(api.post('/create_preference', {}), /resposta inválida/);
    }
});

test('pagamento bem-sucedido mantém o link de checkout', async () => {
    const api = loadApi(async () => ({
        status: 200,
        ok: true,
        json: async () => ({ init_point: 'https://example.com/checkout' }),
    }));
    const { response, data } = await api.post('/create_preference', { plan: 'mensal1' });
    assert.equal(response.ok, true);
    assert.equal(data.init_point, 'https://example.com/checkout');
});
