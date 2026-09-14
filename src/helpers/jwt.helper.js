const jwt = require('jsonwebtoken');

/**
 * Helper para manipulação e validação de tokens JWT
 */
class JwtHelper {
    /**
     * Gera um novo token JWT para um aluno
     * @param {Object} payload Dados para salvar no token (ex: { userId: 1, subscriptionActive: true })
     * @param {string} expiresIn Tempo de expiração (ex: '7d', '24h')
     * @returns {string} Token JWT
     */
    static generateToken(payload, expiresIn = '7d') {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET não está configurado no arquivo .env');
        }

        return jwt.sign(payload, secret, { expiresIn });
    }

    /**
     * @param {string} token Token recebido no header
     * @returns {Object|null} Payload decodificado ou null se inválido/expirado
     */
    static verifyToken(token) {
        try {
            const secret = process.env.JWT_SECRET;
            return jwt.verify(token, secret);
        } catch (error) {
            console.error('[JWT Helper] Token inválido ou expirado:', error.message);
            return null;
        }
    }
}

module.exports = JwtHelper;
