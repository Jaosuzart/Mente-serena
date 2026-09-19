const btnBasicMensal = document.getElementById('btn-buy-basic-mensal');
const btnBasicVitalicio = document.getElementById('btn-buy-basic-vitalicio');
const btnTrial = document.getElementById('btn-buy-trial');
if (btnBasicMensal) btnBasicMensal.addEventListener('click', () => window.location.href = 'checkout.html?plan=mensal1');
if (btnBasicVitalicio) btnBasicVitalicio.addEventListener('click', () => window.location.href = 'checkout.html?plan=vitalicio1');
if (btnTrial) btnTrial.addEventListener('click', () => window.location.href = 'checkout.html?plan=trial');

const btnIntermediaryMensal = document.getElementById('btn-buy-intermediary-mensal');
const btnIntermediaryVitalicio = document.getElementById('btn-buy-intermediary-vitalicio');
if (btnIntermediaryMensal) btnIntermediaryMensal.addEventListener('click', () => window.location.href = 'checkout.html?plan=mensal2');
if (btnIntermediaryVitalicio) btnIntermediaryVitalicio.addEventListener('click', () => window.location.href = 'checkout.html?plan=vitalicio2');

const btnPremiumMensal = document.getElementById('btn-buy-premium-mensal');
const btnPremiumVitalicio = document.getElementById('btn-buy-premium-vitalicio');
if (btnPremiumMensal) btnPremiumMensal.addEventListener('click', () => window.location.href = 'checkout.html?plan=mensal3');
if (btnPremiumVitalicio) btnPremiumVitalicio.addEventListener('click', () => window.location.href = 'checkout.html?plan=vitalicio3');

const supportBtn = document.getElementById('supportActionBtn');
if (supportBtn) {
    supportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const p = ['55', '71', '982767129'].join('');
        const msg = encodeURIComponent('olá, seja bem-vindo ao curso de mente serena');
        window.open(`https://wa.me/${p}?text=${msg}`, '_blank', 'noopener,noreferrer');
    });
}
