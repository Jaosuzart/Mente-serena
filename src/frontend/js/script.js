let mp;
if (typeof MercadoPago !== 'undefined') {
    mp = new MercadoPago('APP_USR-35017e21-ee72-4adc-a0d9-5a4f89250e0c', {
        locale: 'pt-BR'
    });
}

const btnBasic = document.getElementById('btn-buy-basic');
const btnIntermediary = document.getElementById('btn-buy-intermediary');
const btnPremium = document.getElementById('btn-buy-premium');
const btnFree = document.getElementById('btn-free');
const feedbackMsg = document.getElementById('feedback-message');
const walletContainer = document.getElementById('wallet_container');

async function iniciarPagamento(btn, plan, preco) {
    const textoOriginal = btn.innerText;
    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="fw-bold d-flex align-items-center justify-content-center"><span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>CARREGANDO...</span>';
        if (feedbackMsg) { feedbackMsg.innerText = ''; }

        const response = await fetch('/create_preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'aluno@email.com',
                nome:  'Aluno Mente Serena',
                plan:  plan
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Erro HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.is_subscription && data.init_point) {
            window.location.href = data.init_point;
            return;
        }

        const prefId = data.preferenceId || data.id;

        if (!prefId) {
            throw new Error(data.error || 'Preferência de pagamento não retornada pelo servidor.');
        }

        if (walletContainer) {
            walletContainer.innerHTML = '';
            walletContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        mp.bricks().create('wallet', 'wallet_container', {
            initialization: {
                preferenceId: prefId,
                redirectMode: 'modal'
            },
            customization: {
                texts: { action: 'pay' }
            }
        });

        btn.style.display = 'none';

    } catch (error) {
        console.error('[Pagamento] Erro:', error);
        if (feedbackMsg) {
            feedbackMsg.innerText = `⚠️ ${error.message || 'Erro ao carregar o pagamento. Tente novamente.'}`;
            feedbackMsg.style.color = 'red';
        }
    } finally {
        btn.disabled = false;
        btn.innerText = textoOriginal;
    }
}

const btnBasicMensal = document.getElementById('btn-buy-basic-mensal');
const btnBasicVitalicio = document.getElementById('btn-buy-basic-vitalicio');
const btnTrial = document.getElementById('btn-buy-trial');
if (btnBasicMensal) btnBasicMensal.addEventListener('click', () => iniciarPagamento(btnBasicMensal, 'mensal1', 20));
if (btnBasicVitalicio) btnBasicVitalicio.addEventListener('click', () => iniciarPagamento(btnBasicVitalicio, 'vitalicio1', 30));
if (btnTrial) btnTrial.addEventListener('click', () => iniciarPagamento(btnTrial, 'trial', 0));

const btnIntermediaryMensal = document.getElementById('btn-buy-intermediary-mensal');
const btnIntermediaryVitalicio = document.getElementById('btn-buy-intermediary-vitalicio');
if (btnIntermediaryMensal) btnIntermediaryMensal.addEventListener('click', () => iniciarPagamento(btnIntermediaryMensal, 'mensal2', 40));
if (btnIntermediaryVitalicio) btnIntermediaryVitalicio.addEventListener('click', () => iniciarPagamento(btnIntermediaryVitalicio, 'vitalicio2', 50));

const btnPremiumMensal = document.getElementById('btn-buy-premium-mensal');
const btnPremiumVitalicio = document.getElementById('btn-buy-premium-vitalicio');
if (btnPremiumMensal) btnPremiumMensal.addEventListener('click', () => iniciarPagamento(btnPremiumMensal, 'mensal3', 60));
if (btnPremiumVitalicio) btnPremiumVitalicio.addEventListener('click', () => iniciarPagamento(btnPremiumVitalicio, 'vitalicio3', 80));

if (btnFree) {
    btnFree.addEventListener('click', async () => {
        const textoOriginal = btnFree.innerText;
        try {
            btnFree.disabled = true;
            btnFree.innerText = 'Processando vaga...';
            if (feedbackMsg) { feedbackMsg.innerText = ''; }

            const response = await fetch('/claim_free_spot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'aluno.gratis@email.com' })
            });

            if (response.status === 200) {
                if (feedbackMsg) {
                    feedbackMsg.innerText = '🎉 Sucesso! Você garantiu sua vaga gratuita.';
                    feedbackMsg.style.color = 'green';
                }
            } else if (response.status === 403) {
                if (feedbackMsg) {
                    feedbackMsg.innerText = '❌ Vagas esgotadas! Todas as vagas já foram preenchidas.';
                    feedbackMsg.style.color = 'red';
                }
            } else {
                throw new Error('Erro desconhecido.');
            }
        } catch (error) {
            console.error(error);
            if (feedbackMsg) {
                feedbackMsg.innerText = 'Erro ao tentar resgatar a vaga. O servidor pode estar ocupado.';
                feedbackMsg.style.color = 'red';
            }
        } finally {
            btnFree.disabled = false;
            btnFree.innerText = textoOriginal;
        }
    });
}

const supportBtn = document.getElementById('supportActionBtn');
if (supportBtn) {
    supportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const p = ['55', '71', '982767129'].join('');
        const msg = encodeURIComponent('olá, seja bem-vindo ao curso de mente serena');
        window.open(`https://wa.me/${p}?text=${msg}`, '_blank', 'noopener,noreferrer');
    });
}
