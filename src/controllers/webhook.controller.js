const OrderModel = require('../models/OrderModel');

const processWebhook = async (req, res) => {
    const paymentId = req.query.id || req.body?.data?.id;
    const type = req.query.topic || req.body?.type;

    try {
        if (type === 'payment' && paymentId) {
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
            });
            const paymentInfo = await response.json();
            if (paymentInfo.status === 'approved') {
                console.log(`✅ [PAGAMENTO BLINDADO] Confirmação Recebida! ID: ${paymentId}. Dinheiro na conta. Liberando curso ao aluno.`); const orderId = paymentInfo.external_reference;
                if (orderId) {
                    try {
                        await OrderModel.updateOrderStatusByPayment(paymentId, 'aprovado', orderId);
                        console.log(`📦 Status do pedido ${orderId} atualizado para 'aprovado' no banco de dados!`);
                    } catch (dbError) {
                        console.error(`❌ Erro ao atualizar pedido ${orderId} no banco:`, dbError);
                    }
                } else {
                    console.warn(`⚠️ Pagamento ${paymentId} aprovado, mas sem external_reference. Não foi possível atualizar no banco automaticamente.`);
                }
            }
        }
        res.status(200).send('OK');
    } catch (error) {
        console.error("❌ Erro na validação de autenticação:", error);
        res.status(500).send('Erro');
    }
};

module.exports = {
    processWebhook
};
