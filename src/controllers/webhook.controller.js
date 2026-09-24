const OrderModel = require('../models/OrderModel');
const { buscarFiltroUsuario } = require('../services/checkout/userService');
const { registrarUsoCupom } = require('../services/checkout/couponService');

const processWebhook = async (req, res) => {
    const paymentId = req.query['data.id'] || req.query.id || req.body?.data?.id;
    const type = req.query.topic || req.body?.type;

    try {
        if ((type === 'payment' || type === 'subscription_preapproval') && paymentId) {
            if (type === 'payment') {
                const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                    headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
                });
                const paymentInfo = await response.json();
                const orderId = paymentInfo.external_reference;

                if (orderId) {
                    let newStatus = 'pendente';
                    if (paymentInfo.status === 'approved') {
                        newStatus = 'aprovado';
                        console.log(`✅ [PAGAMENTO BLINDADO] Confirmação Recebida! ID: ${paymentId}. Dinheiro na conta. Liberando curso ao aluno.`); 
                        
                        try {
                            const order = await OrderModel.getOrderByOrderId(orderId);
                            if (order && order.email) {
                                const filtro = await buscarFiltroUsuario(order.email);
                                if (filtro && filtro.cupom) {
                                    await registrarUsoCupom(order.email, filtro.cupom, filtro.desconto_aplicado, orderId);
                                    console.log(`🏷️  Uso do cupom ${filtro.cupom} registrado para ${order.email} (Pedido: ${orderId})`);
                                }
                            }
                        } catch (err) {
                            console.error("Erro ao registrar uso de cupom no webhook:", err);
                        }
                    } else if (paymentInfo.status === 'rejected') {
                        newStatus = 'recusado';
                        console.log(`❌ Pagamento ${paymentId} recusado.`);
                    } else if (['refunded', 'charged_back', 'cancelled'].includes(paymentInfo.status)) {
                        newStatus = 'reembolsado';
                        console.log(`⚠️ Pagamento ${paymentId} reembolsado/cancelado.`);
                    } else {
                        console.log(`⏳ Pagamento ${paymentId} com status: ${paymentInfo.status}`);
                    }

                    try {
                        await OrderModel.updateOrderStatusByPayment(paymentId, newStatus, orderId);
                        console.log(`📦 Status do pedido ${orderId} atualizado para '${newStatus}' no banco de dados!`);
                    } catch (dbError) {
                        console.error(`❌ Erro ao atualizar pedido ${orderId} no banco:`, dbError);
                    }
                } else {
                    console.warn(`⚠️ Pagamento ${paymentId} (${paymentInfo.status}) recebido, mas sem external_reference. Não foi possível atualizar no banco automaticamente.`);
                }
            } else if (type === 'subscription_preapproval') {
                console.log(`[WEBHOOK] Notificação de assinatura (PreApproval) recebida: ${paymentId}`);
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
