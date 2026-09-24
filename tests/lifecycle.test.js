const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

function run(script) {
    const result = spawnSync(process.execPath, ['-e', script], {
        cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 5000,
        env: { ...process.env, WHATSAPP_ENABLED: 'false' }
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
}

test('falha no banco impede escuta e fecha o pool', () => {
    run(`
        const assert = require('node:assert/strict');
        let closed = false;
        require.cache[require.resolve('./src/app')] = { exports: {
            listen() { throw new Error('Não deveria abrir porta'); }
        }};
        require.cache[require.resolve('./src/config/database')] = { exports: {
            query: async () => { throw new Error('offline'); },
            end: async () => { closed = true; }
        }};
        require('./src/server').start().then(() => process.exit(2), error => {
            assert.equal(error.message, 'offline');
            assert.equal(closed, true);
        });
    `);
});

test('servidor aguarda inicialização e SIGTERM encerra HTTP antes do pool', () => {
    const output = run(`
        const assert = require('node:assert/strict');
        const { EventEmitter } = require('node:events');
        let queries = 0;
        let httpClosed = false;
        const listener = new EventEmitter();
        listener.address = () => ({ port: 3000 });
        listener.close = callback => { httpClosed = true; callback(); };
        require.cache[require.resolve('./src/app')] = { exports: {
            listen(port, callback) {
                assert.equal(queries, 2);
                queueMicrotask(callback);
                return listener;
            }
        }};
        require.cache[require.resolve('./src/config/database')] = { exports: {
            query: async () => { queries++; },
            end: async () => {
                assert.equal(httpClosed, true);
                console.log('POOL_CLOSED');
            }
        }};
        require('./src/server').start().then(() => process.emit('SIGTERM'));
    `);
    assert.match(output, /POOL_CLOSED/);
});
