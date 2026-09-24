function positiveInteger(value, fallback, name) {
    if (value === undefined || value === '') return fallback;
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        throw new Error(`${name} deve ser um inteiro positivo.`);
    }
    return parsed;
}

function buildDatabaseOptions(env = process.env) {
    const connection = env.DATABASE_URL ? { uri: env.DATABASE_URL } : {
        host: env.DB_HOST,
        port: positiveInteger(env.DB_PORT, 3306, 'DB_PORT'),
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        // Mantém a compatibilidade SSL anterior quando DB_SSL não é informado.
        ssl: env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false }
    };
    return {
        ...connection,
        waitForConnections: true,
        connectionLimit: positiveInteger(env.DB_CONN_LIMIT, 10, 'DB_CONN_LIMIT'),
        queueLimit: positiveInteger(env.DB_QUEUE_LIMIT, 100, 'DB_QUEUE_LIMIT'),
        connectTimeout: positiveInteger(env.DB_CONNECT_TIMEOUT_MS, 10000, 'DB_CONNECT_TIMEOUT_MS')
    };
}
module.exports = { buildDatabaseOptions };
