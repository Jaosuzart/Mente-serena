const PAYMENT_METHOD_CONFIGS = {
    credit_card: () => ({
        installments: 12,
        excluded_payment_types: [
            { id: 'ticket' },
            { id: 'bank_transfer' },
        ],
    }),
    pix: () => ({
        installments: 1,
        excluded_payment_types: [
            { id: 'ticket' },
            { id: 'credit_card' },
            { id: 'debit_card' },
        ],
        default_payment_method_id: 'pix',
    }),
    boleto: () => ({
        installments: 1,
        excluded_payment_types: [
            { id: 'credit_card' },
            { id: 'debit_card' },
            { id: 'bank_transfer' },
        ],
        default_payment_method_id: 'bolbradesco',
    }),
    todos: () => ({
        installments: 12,
        excluded_payment_types: [
            { id: 'ticket' }
        ],
    }),
};

function getPaymentMethodConfig(metodoPagamento) {
    const buildConfig = PAYMENT_METHOD_CONFIGS[metodoPagamento];

    if (!buildConfig) {
        console.warn(`[PaymentFilter] Método desconhecido: "${metodoPagamento}". Usando configuração padrão.`);
        return PAYMENT_METHOD_CONFIGS['todos']();
    }

    return buildConfig();
}

function isMetodoPagamentoValido(metodoPagamento) {
    return Object.keys(PAYMENT_METHOD_CONFIGS).includes(metodoPagamento);
}

function listarMetodosDisponiveis() {
    return [
        {
            id: 'credit_card',
            label: 'Cartão de Crédito',
            descricao: 'Até 12x sem juros',
            icone: '💳',
        },
        {
            id: 'pix',
            label: 'PIX',
            descricao: 'Aprovação instantânea',
            icone: '⚡',
        },
        {
            id: 'boleto',
            label: 'Boleto Bancário',
            descricao: 'Vencimento em 3 dias úteis',
            icone: '🏦',
        },
    ];
}

module.exports = {
    getPaymentMethodConfig,
    isMetodoPagamentoValido,
    listarMetodosDisponiveis,
    PAYMENT_METHOD_CONFIGS,
};
