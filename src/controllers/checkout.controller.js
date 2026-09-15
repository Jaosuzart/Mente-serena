const { MercadoPagoConfig, Preference } = require('mercadopago');
const OrderModel = require('../models/OrderModel');
const crypto = require('crypto');
const { registrarFiltroUsuario } = require('../frontend/assets/filters/userFilters');
const { validarCupom, aplicarDesconto, registrarUsoCupom } = require('../frontend/assets/filters/couponFilters');
const { getPaymentMethodConfig, isMetodoPagamentoValido } = require('../frontend/assets/filters/paymentFilters');

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const preference = new Preference(client);

const createPreference = async (req, res) => {
    try {
        const { email, nome, plan, pagamento = 'todos', cupom = null } = req.body;

        let productPrice = 60.00;
        let productTitle = "Curso Mente Serena - Plano Básico";
        let productId = "curso_mente_serena_basico";

        if (plan === 'intermediario') {
            productPrice = 90.00;
            productTitle = "Curso Mente Serena - Plano Intermediário";
            productId = "curso_mente_serena_intermediario";
        } else if (plan === 'premium') {
            productPrice = 100.00;
            productTitle = "Curso Mente Serena - Plano Premium";
            productId = "curso_mente_serena_premium";
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
