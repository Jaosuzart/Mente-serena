const pool = require('../../config/database');

const FREE_SPOTS_LIMIT = Number.parseInt(process.env.FREE_SPOTS_LIMIT || '20', 10);

class TrialUnavailableError extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'TrialUnavailableError';
        this.code = code;
    }
}

async function reserveTrial(email) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [existing] = await connection.query(
            'SELECT id FROM free_spot_claims WHERE email = ? LIMIT 1 FOR UPDATE',
            [email]
        );

        if (existing.length > 0) {
            throw new TrialUnavailableError(
                'ALREADY_CLAIMED',
                'Este e-mail já utilizou o teste grátis.'
            );
        }

        const [result] = await connection.query(
            `UPDATE free_spots
             SET spots_taken = spots_taken + 1
             WHERE id = 1 AND spots_taken < ?`,
            [FREE_SPOTS_LIMIT]
        );

        if (result.affectedRows === 0) {
            throw new TrialUnavailableError(
                'SOLD_OUT',
                `As ${FREE_SPOTS_LIMIT} vagas do teste grátis já foram preenchidas.`
            );
        }

        await connection.query(
            'INSERT INTO free_spot_claims (email) VALUES (?)',
            [email]
        );
        await connection.commit();
    } catch (error) {
        await connection.rollback();

        if (error?.code === 'ER_DUP_ENTRY') {
            throw new TrialUnavailableError(
                'ALREADY_CLAIMED',
                'Este e-mail já utilizou o teste grátis.'
            );
        }
        throw error;
    } finally {
        connection.release();
    }
}

async function releaseTrial(email) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const [result] = await connection.query(
            'DELETE FROM free_spot_claims WHERE email = ?',
            [email]
        );
        if (result.affectedRows > 0) {
            await connection.query(
                'UPDATE free_spots SET spots_taken = GREATEST(spots_taken - 1, 0) WHERE id = 1'
            );
        }
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = { reserveTrial, releaseTrial, TrialUnavailableError, FREE_SPOTS_LIMIT };
