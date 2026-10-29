const { getPlan } = require('../config/plans');
const { MercadoPagoConfig, Preference, PreApproval } = require('mercadopago');
const OrderModel = require('../models/OrderModel');
const crypto = require('crypto');
const { registrarFiltroUsuario } = require('../services/checkout/userService');
const { validarCupom, aplicarDesconto } = require('../services/checkout/couponService');
const { getPaymentMethodConfig, isMetodoPagamentoValido } = require('../services/checkout/paymentService');
const { reserveTrial, releaseTrial, TrialUnavailableError } = require('../services/checkout/trialService');

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

const preference = new Preference(client);
const preapproval = new PreApproval(client);

const isDev = process.env.NODE_ENV !== 'production';

if (isDev) {
    console.info(
        '🧪 [Mercado Pago] Modo DESENVOLVIMENTO ativo.'
    );
}

function getWebhookUrl() {
    return process.env.MP_WEBHOOK_URL || undefined;
}

const createPreference = async (req, res) => {
    try {
        const {
            email,
            nome,
            plan,
            pagamento = 'todos',
            cupom = null
        } = req.body;

        const selectedPlan = getPlan(plan);

        if (!selectedPlan) {
            return res.status(422).json({
                error: 'Plano inválido.'
            });
        }

        let productPrice = selectedPlan.price;

        const productTitle = selectedPlan.title;
        const productId = selectedPlan.productId;

        const metodoPagamento =
            isMetodoPagamentoValido(pagamento)
                ? pagamento
                : 'todos';

        let descontoAplicado = 0;
        let cupomCodigo = null;
        let cupomMensagem = null;

        // O cupom se aplica aos planos pagos. O trial sempre começa em R$ 0
        // e passa ao preço cheio informado no checkout após o período grátis.
        if (cupom && plan !== 'trial') {
            const resultadoCupom =
                await validarCupom(email, cupom);

            if (resultadoCupom.valido) {
                descontoAplicado =
                    resultadoCupom.desconto;

                cupomCodigo =
                    cupom.trim().toUpperCase();

                cupomMensagem =
                    resultadoCupom.mensagem;

                productPrice =
                    aplicarDesconto(
                        productPrice,
                        descontoAplicado
                    );
            } else {
                cupomMensagem =
                    resultadoCupom.mensagem;
            }
        }

        const orderId =
            crypto.randomUUID();

        if (
            plan === 'trial' ||
            plan.includes('mensal')
        ) {
            let trialReserved = false;
            let subscriptionCreated = false;
            try {
                if (plan === 'trial') {
                    await reserveTrial(email);
                    trialReserved = true;
                }

                const autoRecurring = {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount:
                        productPrice,
                    currency_id: 'BRL'
                };

                if (plan === 'trial') {
                    autoRecurring.free_trial = {
                        frequency: selectedPlan.trialDays,
                        frequency_type: 'days'
                    };
                }

                const response =
                    await preapproval.create({
                        body: {
                            reason:
                                productTitle,

                            auto_recurring:
                                autoRecurring,

                            back_url:
                                `${process.env.FRONTEND_URL}/sucesso.html`,

                            payer_email:
                                email,

                            external_reference:
                                orderId,

                            status:
                                'pending'
                        }
                    });
                subscriptionCreated = true;

                await OrderModel.createOrder({
                    preference_id:
                        response.id,

                    order_id:
                        orderId,

                    nome,
                    email,

                    plano:
                        plan,

                    status:
                        'pendente'
                });

                try {
                    await registrarFiltroUsuario({
                        email,
                        plano: plan,
                        pagamento: 'cartao',
                        cupom: cupomCodigo,
                        desconto:
                            descontoAplicado,
                    });
                } catch (
                    filterError
                ) {
                    console.error(
                        'Erro ao registrar filtro:',
                        filterError
                    );
                }

                return res
                    .status(200)
                    .json({
                        is_subscription:
                            true,

                        init_point:
                            response.init_point,

                        preco_final:
                            autoRecurring
                                .transaction_amount,

                        desconto_aplicado:
                            descontoAplicado,

                        cupom_mensagem:
                            cupomMensagem,
                    });
            } catch (error) {
                if (trialReserved && !subscriptionCreated) {
                    try {
                        await releaseTrial(email);
                    } catch (releaseError) {
                        console.error('Erro ao liberar reserva de teste:', releaseError);
                    }
                }

                console.error(
                    'Erro ao criar assinatura:',
                    error
                );

                if (error instanceof TrialUnavailableError) {
                    return res.status(error.code === 'SOLD_OUT' ? 403 : 409).json({
                        error: error.message
                    });
                }

                const errorMsg =
                    error?.message ||
                    error?.cause?.message ||
                    JSON.stringify(error);

                if (
                    errorMsg.includes(
                        'real or test users'
                    ) ||
                    error?.status === 400
                ) {
                    return res
                        .status(400)
                        .json({
                            error:
                                isDev
                                    ? 'O e-mail informado não é de um usuário de teste do Mercado Pago.'
                                    : 'Erro ao processar pagamento.'
                        });
                }

                return res
                    .status(500)
                    .json({
                        error:
                            'Falha ao processar a assinatura.'
                    });
            }
        }

        const paymentMethodsConfig =
            getPaymentMethodConfig(
                metodoPagamento
            );

        const webhookUrl =
            getWebhookUrl();

        const body = {
            items: [
                {
                    id: productId,
                    title:
                        productTitle,
                    quantity: 1,
                    unit_price:
                        productPrice,
                    currency_id:
                        'BRL'
                }
            ],

            payer: {
                email,
                name: nome
            },

            external_reference:
                orderId,

            payment_methods:
                paymentMethodsConfig,

            back_urls: {
                success:
                    `${process.env.FRONTEND_URL}/sucesso.html`,

                failure:
                    `${process.env.FRONTEND_URL}/falha.html`,

                pending:
                    `${process.env.FRONTEND_URL}/pendente.html`
            },

            auto_return:
                'approved'
        };

        if (webhookUrl) {
            body.notification_url =
                webhookUrl;
        }

        const response =
            await preference.create({
                body
            });

        await OrderModel.createOrder({
            preference_id:
                response.id,

            order_id:
                orderId,

            nome,
            email,

            plano:
                plan,

            status:
                'pendente'
        });

        try {
            await registrarFiltroUsuario({
                email,
                plano: plan,
                pagamento:
                    metodoPagamento,
                cupom:
                    cupomCodigo,
                desconto:
                    descontoAplicado,
            });
        } catch (filterError) {
            console.error(
                'Erro ao registrar filtro:',
                filterError
            );
        }

        return res
            .status(200)
            .json({
                preferenceId:
                    response.id,

                init_point:
                    response.init_point,

                sandbox_init_point:
                    response.sandbox_init_point,

                preco_final:
                    productPrice,

                desconto_aplicado:
                    descontoAplicado,

                cupom_mensagem:
                    cupomMensagem,
            });
    } catch (error) {
        console.error(
            'Erro ao criar preference:',
            error
        );

        return res
            .status(500)
            .json({
                error:
                    'Falha ao processar o checkout.'
            });
    }
};

module.exports = {
    createPreference
};
