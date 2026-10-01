const { test } = require('node:test');
const assert = require('node:assert/strict');

test('Worker serves assets and returns JSON when backend is missing or invalid', async () => {
    const { default: worker } = await import('../src/cloudflare-worker.mjs');
    const env = { ASSETS: { fetch: async () => new Response('site') } };
    assert.equal(await (await worker.fetch(new Request('https://site.example/checkout'), env)).text(), 'site');
    for (const BACKEND_URL of [undefined, 'http://backend.example', 'https://site.example', 'https://backend.example/path']) {
        const response = await worker.fetch(new Request('https://site.example/create_preference', { method: 'POST' }), { ...env, BACKEND_URL });
        assert.equal(response.status, 503);
        assert.match((await response.json()).error, /configurado/);
    }
});

test('Worker forwards payment body, query and backend response without retries', async t => {
    const { default: worker } = await import('../src/cloudflare-worker.mjs');
    t.mock.method(globalThis, 'fetch', async (request, options) => {
        assert.equal(request.url, 'https://backend.example/create_preference?source=checkout');
        assert.equal(request.method, 'POST');
        assert.equal(request.headers.get('cookie'), null);
        assert.equal(options.redirect, 'manual');
        assert.deepEqual(await request.json(), { plan: 'mensal1' });
        return Response.json({ init_point: 'https://payment.example/' });
    });
    const response = await worker.fetch(new Request('https://site.example/create_preference?source=checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: 'private=value' }, body: JSON.stringify({ plan: 'mensal1' }),
    }), { BACKEND_URL: 'https://backend.example' });
    assert.equal((await response.json()).init_point, 'https://payment.example/');
    assert.equal(globalThis.fetch.mock.callCount(), 1);
});

test('Worker returns JSON on connection failure', async t => {
    const { default: worker } = await import('../src/cloudflare-worker.mjs');
    t.mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
    const response = await worker.fetch(new Request('https://site.example/create_preference', { method: 'POST' }), { BACKEND_URL: 'https://backend.example' });
    assert.equal(response.status, 502);
    assert.match((await response.json()).error, /conectar/);
    assert.equal(globalThis.fetch.mock.callCount(), 1);
});
