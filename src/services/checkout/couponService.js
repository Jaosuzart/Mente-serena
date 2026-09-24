const db = require('../../config/database');
const { isUsuarioNovo } = require('./userService');

const CUPONS_DISPONIVEIS = {
    'BEMVINDO10': {
        desconto: 10,
        tipo: 'novo_usuario',
        descricao: 'Desconto de boas-vindas para novos alunos',
        ativo: true,
    },
    'MENTE10': {
        desconto: 10,
        tipo: 'geral',
        descricao: 'Cupom de indicação Mente Serena',
        ativo: true,
    },
};

async function validarCupom(email, codigoCupom) {
    if (!codigoCupom || typeof codigoCupom !== 'string') {
        return { valido: false, desconto: 0, mensagem: 'Nenhum cupom informado.' };
    }

    const codigo = codigoCupom.trim().toUpperCase();
    const cupom  = CUPONS_DISPONIVEIS[codigo];

    if (!cupom || !cupom.ativo) {
        return { valido: false, desconto: 0, mensagem: 'Cupom inválido ou expirado.' };
    }

    if (cupom.tipo === 'novo_usuario') {
        const novo = await isUsuarioNovo(email);
        if (!novo) {
            return {
                valido: false,
                desconto: 0,
                mensagem: 'Este cupom é exclusivo para novos alunos.',
            };
        }
    }

    return {
        valido: true,
        desconto: cupom.desconto,
        mensagem: `✅ Cupom aplicado! ${cupom.desconto}% de desconto. (${cupom.descricao})`,
    };
}

function aplicarDesconto(precoOriginal, percentual) {
    if (!percentual || percentual <= 0) return precoOriginal;
    const desconto = (precoOriginal * percentual) / 100;
    return parseFloat((precoOriginal - desconto).toFixed(2));
}

async function registrarUsoCupom(email, codigo, desconto, orderId) {
    try {
        await db.query(
            `INSERT INTO uso_cupons (email, cupom, desconto_aplicado, order_id)
             VALUES (?, ?, ?, ?)`,
            [email, codigo.toUpperCase(), desconto, orderId]
        );
    } catch (err) {
        console.error(err);
    }
}

module.exports = {
    validarCupom,
    aplicarDesconto,
    registrarUsoCupom,
    CUPONS_DISPONIVEIS,
};
