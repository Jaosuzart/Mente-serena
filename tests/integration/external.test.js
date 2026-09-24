const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
const { loadTestEnvironment } = require('../../src/config/test-environment');
const testEnvironment = loadTestEnvironment();
const options = testEnvironment.database;
const pool = mysql.createPool(options);
after(() => pool.end());

async function safeQuery(connection, sql, values) {
    try { return await connection.query({ sql, timeout: 10000 }, values); }
    catch (error) { throw new Error(`MySQL: ${error.code || 'falha de consulta'}`); }
}

test('MySQL real: conexão e consulta básica', async () => {
    const [rows] = await safeQuery(pool, 'SELECT 1 AS ok');
    assert.equal(rows[0].ok, 1);
});

test('MySQL real: tabelas e colunas necessárias ao checkout', async () => {
    const expected = {
        pedidos: ['id', 'preference_id', 'order_id', 'nome', 'email', 'plano', 'status', 'payment_id'],
        filtros_usuarios: ['id', 'email', 'plano', 'pagamento', 'cupom', 'desconto_aplicado', 'updated_at'],
        uso_cupons: ['email', 'cupom', 'desconto_aplicado', 'order_id'],
        free_spots: ['id', 'spots_taken']
    };
    const [rows] = await safeQuery(pool, 'SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()');
    const available = new Set(rows.map(row => `${row.TABLE_NAME}.${row.COLUMN_NAME}`));
    const missing = Object.entries(expected).flatMap(([table, columns]) => columns.map(column => `${table}.${column}`)).filter(column => !available.has(column));
    assert.deepEqual(missing, [], 'Schema incompleto: ' + missing.join(', '));
});

test('MySQL real: modelos de pedidos e cupons em tabelas temporárias isoladas', async () => {
    const connection = await pool.getConnection();
    const moduleId = require.resolve('../../src/config/database');
    const previousModule = require.cache[moduleId];
    try {
        await safeQuery(connection, `CREATE TEMPORARY TABLE pedidos (
            id INT AUTO_INCREMENT PRIMARY KEY, preference_id VARCHAR(100),
            order_id VARCHAR(100), nome VARCHAR(100), email VARCHAR(254),
            plano VARCHAR(30), status VARCHAR(30), payment_id VARCHAR(100)
        )`);
        await safeQuery(connection, `CREATE TEMPORARY TABLE filtros_usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(254) UNIQUE,
            plano VARCHAR(30), pagamento VARCHAR(30), cupom VARCHAR(50),
            desconto_aplicado DECIMAL(10,2), updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        await safeQuery(connection, `CREATE TEMPORARY TABLE uso_cupons (
            id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(254), cupom VARCHAR(50), desconto_aplicado DECIMAL(10,2), order_id VARCHAR(100)
        )`);
        require.cache[moduleId] = { exports: { query: (sql, values) => safeQuery(connection, sql, values) } };
        const Order = require('../../src/models/OrderModel');
        const users = require('../../src/services/filters/userFilters');
        const coupons = require('../../src/services/filters/couponFilters');
        const email = 'integration@example.invalid';
        assert.equal(await users.isUsuarioNovo(email), true);
        assert.equal((await coupons.validarCupom(email, 'BEMVINDO10')).valido, true);
        const id = await Order.createOrder({ preference_id: 'integration-pref', order_id: 'integration-order', nome: "Teste D'Ávila", email, plano: 'trial' });
        assert.ok(id > 0);
        assert.equal(await Order.countTrials(), 1);
        const pending = await Order.getOrderByPreferenceId('integration-pref');
        assert.equal(pending.nome, "Teste D'Ávila");
        assert.equal(pending.status, 'pendente');
        assert.equal(await Order.updateOrderStatusByPayment('integration-payment', 'aprovado', 'integration-order'), true);
        assert.equal(await users.isUsuarioNovo(email), false);
        assert.equal((await coupons.validarCupom(email, 'BEMVINDO10')).valido, false);
        assert.equal(await Order.updateOrderStatusByPayment('integration-payment', 'aprovado', 'missing-order'), false);
        await users.registrarFiltroUsuario({ email, plano: 'trial', pagamento: 'cartao' });
        await users.registrarFiltroUsuario({ email, plano: 'mensal2', pagamento: 'cartao', cupom: 'MENTE10', desconto: 10 });
        const filter = await users.buscarFiltroUsuario(email);
        assert.equal(filter.plano, 'mensal2');
        assert.equal((await users.listarFiltrosUsuarios()).length, 1);
        await coupons.registrarUsoCupom(email, 'mente10', 10, 'integration-order');
        const [couponRows] = await safeQuery(connection, 'SELECT cupom FROM uso_cupons');
        assert.deepEqual(couponRows.map(row => row.cupom), ['MENTE10']);
    } finally {
        if (previousModule) require.cache[moduleId] = previousModule;
        else delete require.cache[moduleId];
        connection.destroy();
    }
});

test('MySQL real: fila cheia rejeita excesso e libera a consulta aguardando', async () => {
    const bounded = mysql.createPool({ ...options, connectionLimit: 1, queueLimit: 1 });
    let held;
    try {
        held = await bounded.getConnection();
        const waiting = safeQuery(bounded, 'SELECT 1 AS ok');
        await assert.rejects(bounded.query('SELECT 1'), /Queue limit reached/);
        held.release();
        held = null;
        assert.equal((await waiting)[0][0].ok, 1);
    } finally {
        if (held) held.release();
        await bounded.end();
    }
});

let accountRequest;
function getAccount() {
    if (!accountRequest) accountRequest = (async () => {
        assert.ok(testEnvironment.accessToken, 'MP_ACCESS_TOKEN não configurado');
        try {
            const response = await fetch('https://api.mercadopago.com/users/me', {
                headers: { Authorization: `Bearer ${testEnvironment.accessToken}` },
                signal: AbortSignal.timeout(15000)
            });
            const body = await response.json();
            return { status: response.status, isTest: Array.isArray(body.tags) && body.tags.includes('test_user') };
        } catch (error) { throw new Error(`Mercado Pago: ${error.cause?.code || error.name}`); }
    })();
    return accountRequest;
}

test('Mercado Pago real: autenticação da credencial (somente leitura)', async () => {
    assert.equal((await getAccount()).status, 200);
});

test('Mercado Pago: vendedor de teste necessário para homologar assinaturas', async () => {
    const account = await getAccount();
    assert.equal(account.status, 200);
    assert.equal(account.isTest, true, 'Conta configurada não identificada como test_user; criação de assinatura não executada.');
});
