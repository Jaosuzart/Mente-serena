const JwtHelper = require('../helpers/jwt.helper');
const ResponseHelper = require('../helpers/response.helper');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return ResponseHelper.error(res, 'Token de autenticação não fornecido ou inválido', 401);
    }
    const token = authHeader.split(' ')[1];

    const decodedPayload = JwtHelper.verifyToken(token);

    if (!decodedPayload) {
        return ResponseHelper.error(res, 'Sua sessão expirou ou o token é inválido. Faça login novamente.', 401);
    }

    if (decodedPayload.subscriptionActive === false) {
        return ResponseHelper.error(res, 'Sua assinatura está inativa ou expirou. Por favor, renove seu plano.', 403);
    }

    req.user = decodedPayload;

    next();
}

module.exports = authMiddleware;
