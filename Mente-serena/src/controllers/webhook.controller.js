const OrderModel =
    require('../models/OrderModel');

const {
    buscarFiltroUsuario
} =
    require('../services/checkout/userService');

const {
    registrarUsoCupom
} =
    require('../services/checkout/couponService');

const processWebhook =
    async (req, res) => {

    const paymentId =
        req.query['data.id'] ||
        req.query.id ||
        req.body?.data?.id;

    const type =
        req.query.topic ||
        req.body?.type;

    try {

        if (
            !paymentId ||
            (
                type !== 'payment' &&
                type !==
                    'subscription_preapproval'
            )
        ) {

            return res
                .status(200)
                .send(
                    'Ignorado'
                );
        }

        if (
            type ===
            'subscription_preapproval'
        ) {

            console.log(
                `[WEBHOOK] Assinatura recebida: ${paymentId}`
            );

            return res
                .status(200)
                .send('OK');
        }

        const response =
            await fetch(
                `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${process.env.MP_ACCESS_TOKEN}`
                    }
                }
            );

        if (!response.ok) {

            console.error(
                'Falha ao consultar pagamento:',
                response.status
            );

            return res
                .status(502)
                .send(
                    'Falha ao consultar pagamento'
                );
        }

        const paymentInfo =
            await response.json();

        const orderId =
            paymentInfo
                .external_reference;

        if (!orderId) {

            console.warn(
                `Pagamento ${paymentId} sem external_reference.`
            );

            return res
                .status(200)
                .send(
                    'Sem referencia'
                );
        }

        const order =
            await OrderModel
                .getOrderByOrderId(
                    orderId
                );

        if (!order) {

            console.warn(
                `Pedido ${orderId} não encontrado.`
            );

            return res
                .status(200)
                .send(
                    'Pedido nao encontrado'
                );
        }

        const existingPayment =
            await OrderModel
                .getOrderByPaymentId(
                    paymentId
                );

        if (
            existingPayment &&
            existingPayment.status ===
                'aprovado'
        ) {

            return res
                .status(200)
                .send(
                    'Duplicata'
                );
        }

        let newStatus =
            'pendente';

        if (
            paymentInfo.status ===
            'approved'
        ) {

            newStatus =
                'aprovado';

        } else if (
            paymentInfo.status ===
            'rejected'
        ) {

            newStatus =
                'recusado';

        } else if (
            [
                'refunded',
                'charged_back',
                'cancelled'
            ].includes(
                paymentInfo.status
            )
        ) {

            newStatus =
                'reembolsado';
        }

        await OrderModel
            .updateOrderStatusByPayment(
                paymentId,
                newStatus,
                orderId
            );

        if (
            newStatus ===
            'aprovado'
        ) {

            const filtro =
                await buscarFiltroUsuario(
                    order.email
                );

            if (
                filtro?.cupom
            ) {

                await registrarUsoCupom(
                    order.email,
                    filtro.cupom,
                    filtro.desconto_aplicado,
                    orderId
                );
            }

            console.log(
                `Pagamento ${paymentId} aprovado. Pedido ${orderId} liberado.`
            );
        }

        return res
            .status(200)
            .send('OK');

    } catch (error) {

        console.error(
            'Erro no webhook:',
            error
        );

        return res
            .status(500)
            .send('Erro');
    }
};

module.exports = {
    processWebhook
};