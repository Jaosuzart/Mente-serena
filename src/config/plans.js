const PLANS = Object.freeze({
    trial: Object.freeze({ price: 30, title: 'Curso Mente Serena - Teste Grátis (Básico)', productId: 'curso_mente_serena_trial_1' }),
    mensal1: Object.freeze({ price: 30, title: 'Curso Mente Serena - Básico (Mensal)', productId: 'curso_mente_serena_mensal_1' }),
    mensal2: Object.freeze({ price: 50, title: 'Curso Mente Serena - Intermediário (Mensal)', productId: 'curso_mente_serena_mensal_2' }),
    mensal3: Object.freeze({ price: 90, title: 'Curso Mente Serena - Avançado (Mensal)', productId: 'curso_mente_serena_mensal_3' })
});
function getPlan(id) {
    return typeof id === 'string' && Object.hasOwn(PLANS, id) ? PLANS[id] : null;
}
module.exports = { getPlan };
