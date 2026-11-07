const { PreApproval } = require('mercadopago');
const { mercadopagoClient } = require('../config/mercadopago'); // Assumindo que você tem o cliente configurado
class MercadoPagoHelper {

    /**
     * @param {Object} planData Dados do plano
     * @param {string} planData.title Título ou motivo da assinatura
     * @param {number} planData.price Valor da assinatura
     * @param {string} planData.email Email do pagador
     * @returns {Promise<Object>} Resposta da API do Mercado Pago
     */
    static async createSubscriptionPlan(planData) {
        try {
            const preApproval = new PreApproval(mercadopagoClient);
            const response = await preApproval.create({
                body: {
                    reason: planData.title,
                    auto_recurring: {
                        frequency: 1,
                        frequency_type: 'months',
                        transaction_amount: planData.price,
                        currency_id: 'BRL'
                    },
                    back_url: process.env.FRONTEND_URL || 'https://seusite.com/assinatura-concluida',
                    payer_email: planData.email
                }
            });
            return response;
        } catch (error) {
            console.error('[MercadoPago Helper] Erro ao criar plano de assinatura:', error);
            throw error;
        }
    }

    /**
     * @param {string} preapprovalId ID da assinatura
     * @returns {Promise<Object>} Detalhes da assinatura
     */
    static async getSubscription(preapprovalId) {
        try {
            const preApproval = new PreApproval(mercadopagoClient);
            const response = await preApproval.get({ id: preapprovalId });
            return response;
        } catch (error) {
            console.error('[MercadoPago Helper] Erro ao buscar assinatura:', error);
            throw error;
        }
    }
}

module.exports = MercadoPagoHelper;
