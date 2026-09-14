/**
 * Helper para lidar com cálculos de datas comuns em assinaturas
 */
class DateHelper {
    /**
     * Adiciona meses à data atual (útil para calcular expiração da assinatura)
     * @param {number} months Quantidade de meses a adicionar
     * @returns {Date} Nova data
     */
    static addMonthsToCurrentDate(months) {
        const date = new Date();
        date.setMonth(date.getMonth() + months);
        return date;
    }

    /**
     * Verifica se uma assinatura ainda está ativa com base na data de expiração
     * @param {Date|string} expirationDate Data de expiração
     * @returns {boolean} true se ativa, false se expirada
     */
    static isSubscriptionActive(expirationDate) {
        if (!expirationDate) return false;
        
        const now = new Date();
        const expDate = new Date(expirationDate);
        return expDate > now;
    }

    /**
     * Formata uma data para exibição no Brasil (DD/MM/YYYY)
     * @param {Date|string} date Data a ser formatada
     * @returns {string} Data formatada
     */
    static formatDateBR(date) {
        return new Date(date).toLocaleDateString('pt-BR');
    }
}

module.exports = DateHelper;
