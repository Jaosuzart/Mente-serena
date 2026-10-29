const pool =
    require('../config/database');

const FREE_SPOTS_LIMIT =
    Number.parseInt(
        process.env.FREE_SPOTS_LIMIT ||
        '20',
        10
    );

const claimFreeSpot =
    async (req, res) => {

    const connection =
        await pool.getConnection();

    try {

        const {
            email
        } = req.body;

        if (!email) {

            return res
                .status(400)
                .json({
                    error:
                        'O email é obrigatório para resgatar a vaga.'
                });
        }

        await connection
            .beginTransaction();

        const [existing] =
            await connection.query(
                `
                SELECT id
                FROM free_spot_claims
                WHERE email = ?
                LIMIT 1
                FOR UPDATE
                `,
                [email]
            );

        if (
            existing.length >
            0
        ) {

            await connection
                .rollback();

            return res
                .status(409)
                .json({
                    error:
                        'Este e-mail já resgatou uma vaga gratuita.'
                });
        }

        const [result] =
            await connection.query(
                `
                UPDATE free_spots

                SET
                    spots_taken =
                    spots_taken + 1

                WHERE id = 1

                AND spots_taken < ?
                `,
                [
                    FREE_SPOTS_LIMIT
                ]
            );

        if (
            result.affectedRows ===
            0
        ) {

            await connection
                .rollback();

            return res
                .status(403)
                .json({
                    error:
                        `Vagas esgotadas. As ${FREE_SPOTS_LIMIT} vagas gratuitas já foram preenchidas.`
                });
        }

        await connection.query(
            `
            INSERT INTO free_spot_claims
            (email)
            VALUES (?)
            `,
            [email]
        );

        await connection
            .commit();

        return res
            .status(200)
            .json({
                success: true,

                message:
                    'Vaga gratuita garantida com sucesso! Em breve você receberá as instruções de acesso no seu e-mail.'
            });

    } catch (error) {

        await connection
            .rollback();

        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {

            return res
                .status(409)
                .json({
                    error:
                        'Este e-mail já resgatou uma vaga gratuita.'
                });
        }

        console.error(
            'Erro no claimFreeSpot:',
            error
        );

        return res
            .status(500)
            .json({
                error:
                    'Erro interno do servidor ao tentar processar a vaga.'
            });

    } finally {

        connection.release();
    }
};

module.exports = {
    claimFreeSpot
};