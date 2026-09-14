/**
 * Helper para padronizar as respostas HTTP da API
 */
class ResponseHelper {
    /**
     * Envia uma resposta de sucesso
     * @param {Object} res Objeto response do Express
     * @param {Object} data Dados a serem retornados
     * @param {string} message Mensagem opcional
     * @param {number} statusCode Código HTTP (padrão 200)
     */
    static success(res, data = null, message = 'Operação realizada com sucesso', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    }

    /**
     * Envia uma resposta de erro
     * @param {Object} res Objeto response do Express
     * @param {string} message Mensagem de erro
     * @param {number} statusCode Código HTTP (padrão 400)
     * @param {Object} error Detalhes do erro (opcional, cuidado para não vazar info sensível)
     */
    static error(res, message = 'Ocorreu um erro na requisição', statusCode = 400, error = null) {
        const response = {
            success: false,
            message
        };

        // Em desenvolvimento, anexar o erro real pode ajudar no debug
        if (error && process.env.NODE_ENV !== 'production') {
            response.error = error.message || error;
        }

        return res.status(statusCode).json(response);
    }
}

module.exports = ResponseHelper;
