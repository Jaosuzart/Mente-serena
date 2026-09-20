const { MercadoPagoConfig, Preference, PreApproval } = require('mercadopago');
const OrderModel = require('../models/OrderModel');
const crypto = require('crypto');
const { registrarFiltroUsuario } = require('../frontend/assets/filters/userFilters');
const { validarCupom, aplicarDesconto, registrarUsoCupom } = require('../frontend/assets/filters/couponFilters');
const { getPaymentMethodConfig, isMetodoPagamentoValido } = require('../frontend/assets/filters/paymentFilters');

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const preference = new Preference(client);
const preapproval = new PreApproval(client);

// Validação de ambiente
const isDev = process.env.NODE_ENV !== 'production';
if (isDev) {
    console.info('🧪 [Mercado Pago] Modo DESENVOLVIMENTO ativo. Certifique-se de usar credenciais e e-mails de teste.');
}

const createPreference = async (req, res) => {
    try {
        const { email, nome, plan, pagamento = 'todos', cupom = null } = req.body;

        let productPrice = 30.00;
        let productTitle = "Curso Mente Serena - Básico (Mensal)";
        let productId = "curso_mente_serena_mensal_1";

        if (plan === 'trial') {
            productPrice = 30.00;
            productTitle = "Curso Mente Serena - Teste Grátis (Básico)";
            productId = "curso_mente_serena_trial_1";
        } else if (plan === 'mensal2') {
            productPrice = 50.00;
            productTitle = "Curso Mente Serena - Intermediário (Mensal)";
            productId = "curso_mente_serena_mensal_2";
        } else if (plan === 'mensal3') {
            productPrice = 70.00;
            productTitle = "Curso Mente Serena - Avançado (Mensal)";
            productId = "curso_mente_serena_mensal_3";
        }

        const metodoPagamento = isMetodoPagamentoValido(pagamento) ? pagamento : 'todos';

        let descontoAplicado = 0;
        let cupomCodigo = null;
        let cupomMensagem = null;

        if (cupom) {
            const resultadoCupom = await validarCupom(email, cupom);
            if (resultadoCupom.valido) {
                descontoAplicado = resultadoCupom.desconto;
                cupomCodigo = cupom.trim().toUpperCase();
                cupomMensagem = resultadoCupom.mensagem;
                productPrice = aplicarDesconto(productPrice, descontoAplicado);
                console.log(`🏷️  Cupom "${cupomCodigo}" aplicado para ${email}: -${descontoAplicado}% → R$ ${productPrice}`);
            } else {
                cupomMensagem = resultadoCupom.mensagem;
                console.warn(`⚠️  Cupom inválido para ${email}: ${resultadoCupom.mensagem}`);
            }
        }

        const orderId = crypto.randomUUID();

        if (plan === 'trial' || plan.includes('mensal')) {
            try {
                if (plan === 'trial') {
                    const totalTrials = await OrderModel.countTrials();
                    if (totalTrials >= 20) {
                        return res.status(403).json({ error: "As 20 vagas do Teste Grátis já foram preenchidas! Aproveite um de nossos planos regulares." });
                    }
                }

                let autoRecurring = {
                    frequency: 1,
                    frequency_type: "months",
                    transaction_amount: productPrice,
                    currency_id: "BRL"
                };

                if (plan === 'trial') {
                    autoRecurring.transaction_amount = productPrice;
                    autoRecurring.free_trial = {
                        frequency: 15,
                        frequency_type: "days"
                    };
                }

                const response = await preapproval.create({
                    body: {
                        reason: productTitle,
                        auto_recurring: autoRecurring,
                        back_url: `${process.env.FRONTEND_URL}/sucesso`,
                        payer_email: email,
                        external_reference: orderId,
                        status: "pending"
                    }
                });

                await OrderModel.createOrder({
                    preference_id: response.id,
                    order_id: orderId,
                    nome: nome,
                    email: email,
                    plano: plan,
                    status: 'pendente'
                });

                try {
                    await registrarFiltroUsuario({
                        email: email,
                        plano: plan,
                        pagamento: 'cartao',
                        cupom: cupomCodigo,
                        desconto: descontoAplicado,
                    });

                    if (cupomCodigo) {
                        await registrarUsoCupom(email, cupomCodigo, descontoAplicado, orderId);
                    }
                } catch (filterError) {
                    console.error("⚠️  Erro ao registrar filtro/cupom do usuário:", filterError);
                }

                return res.status(200).json({
                    is_subscription: true,
                    init_point: response.init_point,
                    preco_final: autoRecurring.transaction_amount,
                    desconto_aplicado: descontoAplicado,
                    cupom_mensagem: cupomMensagem,
                });
            } catch (error) {
                console.error("Erro ao criar assinatura (PreApproval) do Mercado Pago:", error);
                
                // Detectar erro de ambiente (mistura teste/produção)
                const errorMsg = error?.message || error?.cause?.message || JSON.stringify(error);
                if (errorMsg.includes('real or test users') || error?.status === 400) {
                    console.error(`\n❌ [Mercado Pago] Conflito de ambiente detectado!`);
                    console.error(`   payer_email enviado: ${email}`);
                    console.error(`   → O Access Token e o payer_email devem ser AMBOS de teste ou AMBOS de produção.`);
                    console.error(`   → Crie usuários de teste em: https://www.mercadopago.com.br/developers/panel/app\n`);
                    
                    return res.status(400).json({ 
                        error: isDev 
                            ? 'O e-mail informado não é de um usuário de teste do Mercado Pago. Use um e-mail de conta de teste.'
                            : 'Erro ao processar pagamento. Tente novamente ou use outro e-mail.'
                    });
                }
                
                return res.status(500).json({ error: "Falha ao processar a assinatura." });
            }
        }

        const paymentMethodsConfig = getPaymentMethodConfig(metodoPagamento);

        const response = await preference.create({
            body: {
                items: [
                    {
                        id: productId,
                        title: productTitle,
                        quantity: 1,
                        unit_price: productPrice,
                        currency_id: "BRL"
                    }
                ],
                payer: {
                    email: email,
                    name: nome
                },
                external_reference: orderId,
                payment_methods: paymentMethodsConfig,
                back_urls: {
                    success: `${process.env.FRONTEND_URL}/sucesso`,
                    failure: `${process.env.FRONTEND_URL}/falha`,
                    pending: `${process.env.FRONTEND_URL}/pendente`
                },
                auto_return: "approved"
            }
        });
        try {
            await OrderModel.createOrder({
                preference_id: response.id,
                order_id: orderId,
                nome: nome,
                email: email,
                plano: plan,
                status: 'pendente'
            });
            console.log(`✅ Pedido salvo: Order ${orderId} | Preference ${response.id}`);
        } catch (dbError) {
            console.error("❌ Erro ao salvar pedido no banco:", dbError);
        }

        try {
            await registrarFiltroUsuario({
                email: email,
                plano: plan,
                pagamento: metodoPagamento,
                cupom: cupomCodigo,
                desconto: descontoAplicado,
            });

            if (cupomCodigo) {
                await registrarUsoCupom(email, cupomCodigo, descontoAplicado, orderId);
            }
        } catch (filterError) {
            console.error("⚠️  Erro ao registrar filtro do usuário:", filterError);
        }
        return res.status(200).json({
            preferenceId: response.id,
            init_point: response.init_point,
            sandbox_init_point: response.sandbox_init_point,
            preco_final: productPrice,
            desconto_aplicado: descontoAplicado,
            cupom_mensagem: cupomMensagem,
        });

    } catch (error) {
        console.error("Erro ao criar preference do Mercado Pago:", error);
        return res.status(500).json({ error: "Falha ao processar o checkout." });
    }
};

module.exports = {
    createPreference
};
