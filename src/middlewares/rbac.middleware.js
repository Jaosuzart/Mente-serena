const JwtHelper = require('../helpers/jwt.helper');
const ResponseHelper = require('../helpers/response.helper');

/**
 * Middleware de Autenticação JWT com resolução de Role e Identidade
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return ResponseHelper.error(res, 'Token de autenticação não fornecido ou inválido', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = JwtHelper.verifyToken(token);

    if (!decoded) {
        return ResponseHelper.error(res, 'Sua sessão expirou ou o token é inválido. Faça login novamente.', 401);
    }

    // Normaliza os dados do usuário na requisição
    req.user = {
        id: decoded.id || decoded.userId,
        email: decoded.email,
        nome: decoded.nome,
        role: decoded.role || 'aluno',
        subscriptionActive: decoded.subscriptionActive !== false
    };

    next();
}

/**
 * Garante que o usuário possua ao menos um dos papéis informados
 * @param {Array<string>} allowedRoles Ex: ['admin'] ou ['admin', 'instrutor']
 */
function requireRole(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return ResponseHelper.error(res, 'Usuário não autenticado', 401);
        }

        if (!allowedRoles.includes(req.user.role)) {
            return ResponseHelper.error(
                res,
                `Acesso negado: operação restrita a [${allowedRoles.join(', ')}]. Seu papel atual é '${req.user.role}'.`,
                403
            );
        }

        next();
    };
}

const requireAdmin = requireRole(['admin']);
const requireInstructorOrAdmin = requireRole(['admin', 'instrutor']);

module.exports = {
    authenticateToken,
    requireRole,
    requireAdmin,
    requireInstructorOrAdmin
};
