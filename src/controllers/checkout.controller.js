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

function getSafeFrontendUrl() {
    return (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost'))
        ? process.env.FRONTEND_URL.replace(/\/$/, '')
        : 'https://menteserena.life';
}

function buildSubscriptionCheckoutUrl(preapprovalId) {
    if (!preapprovalId) return null;
    if (/^https?:\/\//i.test(preapprovalId)) return preapprovalId;
    return `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=${encodeURIComponent(preapprovalId)}`;
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

        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const selectedPlan = getPlan(plan);

        if (!selectedPlan) {
            return res.status(422).json({
                error: 'Plano inválido.'
            });
        }

        let productPrice = selectedPlan.price;

        const productTitle = selectedPlan.title;
        const productId = selectedPlan.productId;
        const safeFrontendUrl = getSafeFrontendUrl();

        const metodoPagamento =
            isMetodoPagamentoValido(pagamento)
                ? pagamento
                : 'todos';

        let descontoAplicado = 0;
        let cupomCodigo = null;
        let cupomMensagem = null;
        if (cupom && plan !== 'trial') {
            const resultadoCupom =
                await validarCupom(normalizedEmail, cupom);

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
        if (
            plan === 'trial' ||
            plan.includes('mensal')
        ) {
            let trialReserved = false;
            let dbOrderId = null;
            let orderId = null;

            try {
                const pedidoExistente =
                    await OrderModel.findPendingOrder(normalizedEmail, plan);

                if (pedidoExistente && pedidoExistente.preference_id) {
                    let initPoint = null;
                    try {
                        const mpSub = await preapproval.get({ id: pedidoExistente.preference_id });
                        initPoint = mpSub?.init_point || mpSub?.sandbox_init_point || null;
                    } catch (_) { }

                    initPoint = initPoint || buildSubscriptionCheckoutUrl(pedidoExistente.preference_id);

                    console.info(
                        `[Checkout] Pedido pendente reutilizado: ${pedidoExistente.order_id}`
                    );
                    return res
                        .status(200)
                        .json({
                            is_subscription:
                                true,

                            order_id:
                                pedidoExistente.order_id,

                            init_point:
                                initPoint,

                            preco_final:
                                productPrice,

                            desconto_aplicado:
                                descontoAplicado,

                            cupom_mensagem:
                                cupomMensagem,
                        });
                }

                if (plan === 'trial') {
                    await reserveTrial(normalizedEmail);
                    trialReserved = true;
                }

                orderId = crypto.randomUUID();

                dbOrderId = await OrderModel.createOrder({
                    preference_id: null,
                    order_id: orderId,
                    nome,
                    email: normalizedEmail,
                    plano: plan,
                    status: 'iniciando'
                });

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
                                `${safeFrontendUrl}/sucesso.html`,

                            payer_email:
                                normalizedEmail,

                            external_reference:
                                orderId,

                            status:
                                'pending'
                        }
                    });

                const checkoutUrl =
                    response.init_point ||
                    response.sandbox_init_point ||
                    buildSubscriptionCheckoutUrl(response.id);

                if (!checkoutUrl) {
                    throw new Error('Mercado Pago não retornou URL de checkout válida.');
                }
                await OrderModel.updatePreferenceId(orderId, response.id);
                await OrderModel.updateOrderStatusByPayment(null, 'pendente', orderId);

                try {
                    await registrarFiltroUsuario({
                        email: normalizedEmail,
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

                        order_id:
                            orderId,

                        init_point:
                            checkoutUrl,

                        preco_final:
                            autoRecurring
                                .transaction_amount,

                        desconto_aplicado:
                            descontoAplicado,

                        cupom_mensagem:
                            cupomMensagem,
                    });
            } catch (error) {
                if (trialReserved) {
                    try {
                        await releaseTrial(normalizedEmail);
                    } catch (releaseError) {
                        console.error('Erro ao liberar reserva de teste:', releaseError);
                    }
                }

                if (dbOrderId && orderId) {
                    try {
                        await OrderModel.updateOrderStatusByPayment(null, 'erro_mp', orderId);
                    } catch (_) { }
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

                if (errorMsg.includes('real or test users')) {
                    const isProdToken = process.env.MP_ACCESS_TOKEN && !process.env.MP_ACCESS_TOKEN.includes('TEST-');
                    return res.status(400).json({
                        error: isProdToken
                            ? 'Você está usando credenciais de produção do Mercado Pago. Para prosseguir, informe um e-mail real (ex: seu e-mail pessoal).'
                            : 'O e-mail informado não é de um usuário de teste do Mercado Pago.'
                    });
                }

                if (error?.status === 400) {
                    return res.status(400).json({
                        error: isDev ? (error?.message || 'Dados inválidos na requisição ao Mercado Pago.') : 'Erro ao processar pagamento.'
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
        const pedidoExistente =
            await OrderModel.findPendingOrder(normalizedEmail, plan);

        if (pedidoExistente && pedidoExistente.preference_id) {
            console.info(
                `[Checkout] Pedido pendente reutilizado: ${pedidoExistente.order_id}`
            );

            let initPoint = null;
            try {
                const mpPref = await preference.get({ id: pedidoExistente.preference_id });
                initPoint = mpPref.init_point || mpPref.sandbox_init_point || null;
            } catch (_) { }

            if (initPoint) {
                return res
                    .status(200)
                    .json({
                        preferenceId:
                            pedidoExistente.preference_id,

                        order_id:
                            pedidoExistente.order_id,

                        init_point:
                            initPoint,

                        preco_final:
                            productPrice,

                        desconto_aplicado:
                            descontoAplicado,

                        cupom_mensagem:
                            cupomMensagem,
                    });
            }
        }

        const orderId = crypto.randomUUID();

        const paymentMethodsConfig =
            getPaymentMethodConfig(
                metodoPagamento
            );

        const webhookUrl =
            getWebhookUrl();

        await OrderModel.createOrder({
            preference_id: null,
            order_id: orderId,
            nome,
            email: normalizedEmail,
            plano: plan,
            status: 'iniciando'
        });

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
                email: normalizedEmail,
                name: nome
            },

            external_reference:
                orderId,

            payment_methods:
                paymentMethodsConfig,

            back_urls: {
                success:
                    `${safeFrontendUrl}/sucesso.html`,

                failure:
                    `${safeFrontendUrl}/falha.html`,

                pending:
                    `${safeFrontendUrl}/pendente.html`
            },

            auto_return:
                'approved'
        };

        if (webhookUrl) {
            body.notification_url =
                webhookUrl;
        }

        let mpResponse;
        try {
            mpResponse =
                await preference.create({
                    body
                });
        } catch (mpError) {
            await OrderModel.updateOrderStatusByPayment(null, 'erro_mp', orderId);
            throw mpError;
        }

        const checkoutUrl = mpResponse.init_point || mpResponse.sandbox_init_point;
        if (!checkoutUrl) {
            await OrderModel.updateOrderStatusByPayment(null, 'erro_mp', orderId);
            throw new Error('Mercado Pago não retornou init_point válido.');
        }
        await OrderModel.updatePreferenceId(orderId, mpResponse.id);
        await OrderModel.updateOrderStatusByPayment(null, 'pendente', orderId);

        try {
            await registrarFiltroUsuario({
                email: normalizedEmail,
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
                    mpResponse.id,

                order_id:
                    orderId,

                init_point:
                    checkoutUrl,

                sandbox_init_point:
                    mpResponse.sandbox_init_point,

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