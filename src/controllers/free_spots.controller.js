const pool = require('../config/database');

const claimFreeSpot = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'O email é obrigatório para resgatar a vaga.' });
        }
        const [result] = await pool.query(
            `UPDATE free_spots 
             SET spots_taken = spots_taken + 1 
             WHERE id = 1 AND spots_taken < 4`
        )
        if (result.affectedRows === 0) {
            console.warn(`❌ [Vagas] Tentativa falha de resgate (vagas esgotadas) pelo email: ${email}`);
            return res.status(403).json({ error: 'Vagas esgotadas. Infelizmente as 4 vagas gratuitas já foram preenchidas.' });
        }

        console.log(`🎉 [Vagas] Vaga gratuita resgatada com sucesso pelo email: ${email}`);
        return res.status(200).json({
            success: true,
            message: 'Vaga gratuita garantida com sucesso! Em breve você receberá as instruções de acesso no seu e-mail.'
        });

    } catch (error) {
        console.error('❌ Erro no claimFreeSpot:', error);
        return res.status(500).json({ error: 'Erro interno do servidor ao tentar processar a vaga.' });
    }
};

module.exports = {
    claimFreeSpot
};
