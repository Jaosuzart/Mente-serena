const btnBasicMensal = document.getElementById('btn-buy-basic-mensal');
const btnTrial = document.getElementById('btn-buy-trial');
if (btnBasicMensal) btnBasicMensal.addEventListener('click', () => window.location.href = 'checkout.html?plan=mensal1');
if (btnTrial) btnTrial.addEventListener('click', () => window.location.href = 'checkout.html?plan=trial');

const btnIntermediaryMensal = document.getElementById('btn-buy-intermediary-mensal');
if (btnIntermediaryMensal) btnIntermediaryMensal.addEventListener('click', () => window.location.href = 'checkout.html?plan=mensal2');

const btnPremiumMensal = document.getElementById('btn-buy-premium-mensal');
if (btnPremiumMensal) btnPremiumMensal.addEventListener('click', () => window.location.href = 'checkout.html?plan=mensal3');

const supportBtn = document.getElementById('supportActionBtn');
if (supportBtn) {
    supportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const p = ['55', '71', '982767129'].join('');
        const msg = encodeURIComponent('olá, seja bem-vindo ao curso de mente serena');
        window.open(`https://wa.me/${p}?text=${msg}`, '_blank', 'noopener,noreferrer');
    });
}

const promoBanner = document.getElementById('promoBanner');
const btnFecharPromo = document.getElementById('btnFecharPromo');

if (promoBanner && sessionStorage.getItem('promoBannerFechado') === 'true') {
    promoBanner.style.display = 'none';
}

if (btnFecharPromo && promoBanner) {
    btnFecharPromo.addEventListener('click', () => {
        promoBanner.style.display = 'none';
        sessionStorage.setItem('promoBannerFechado', 'true');
    });
}

const cookieBanner = document.getElementById('cookieConsentBanner');
const btnCookieAccept = document.getElementById('btnCookieAccept');

if (cookieBanner && btnCookieAccept) {
    if (!localStorage.getItem('cookieConsent')) {
        cookieBanner.classList.remove('d-none');
    }

    btnCookieAccept.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'true');
        cookieBanner.style.transform = 'translateY(100%)';
        setTimeout(() => cookieBanner.classList.add('d-none'), 300);
    });
}
