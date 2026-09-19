document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '';

    const form = document.getElementById('checkout-form');
    const btnComprar = document.getElementById('btn-comprar');
    const btnGratis = document.getElementById('btn-gratis');
    const inputNome = document.getElementById('nome');
    const inputEmail = document.getElementById('email');
    const statusMsg = document.getElementById('mensagem-status');
    const spanVagas = document.getElementById('vagas-restantes');
    const radiosPlan = document.getElementsByName('plan');
    const btnComprarText = document.getElementById('btn-comprar-text');

    const inputCupom = document.getElementById('cupom');
    const btnAplicarCupom = document.getElementById('btn-aplicar-cupom');
    const cupomStatus = document.getElementById('cupom-status');

    const radiosPagamento = document.getElementsByName('pagamento');

    let cupomValidado = null;
    let descontoAtual = 0;
    // Preços atualizados para bater com a Landing Page
    const PRECOS = { trial: 0, mensal1: 20, vitalicio1: 30, mensal2: 40, vitalicio2: 50, mensal3: 60, vitalicio3: 80 };

    function getPrecoComDesconto(plano) {
        const base = PRECOS[plano] || 0;
        if (descontoAtual > 0) {
            return (base - (base * descontoAtual / 100)).toFixed(2);
        }
        return base.toFixed(2);
    }

    function updateButtonPrice() {
        const selectedPlan = Array.from(radiosPlan).find(r => r.checked)?.value;
        if (!selectedPlan) return;
        const preco = getPrecoComDesconto(selectedPlan);
        const label = descontoAtual > 0
            ? `Garantir Minha Vaga (R$ ${preco}) 🏷️ -${descontoAtual}%`
            : `Garantir Minha Vaga (R$ ${preco})`;
        btnComprarText.textContent = label;
    }

    // Auto-selecionar plano baseado na URL
    const urlParams = new URLSearchParams(window.location.search);
    const planFromUrl = urlParams.get('plan');
    if (planFromUrl) {
        const radio = Array.from(radiosPlan).find(r => r.value === planFromUrl);
        if (radio) {
            radio.checked = true;
        }
    }

    Array.from(radiosPlan).forEach(radio => {
        radio.addEventListener('change', updateButtonPrice);
    });
    
    // Initial call to set the correct price on load
    updateButtonPrice();

    if (btnAplicarCupom) {
        btnAplicarCupom.addEventListener('click', async () => {
            const email = inputEmail.value.trim();
            const cupom = inputCupom?.value.trim();

            if (!email || !inputEmail.checkValidity()) {
                showCupomStatus('Informe seu e-mail antes de aplicar o cupom.', 'error');
                return;
            }
            if (!cupom) {
                showCupomStatus('Digite um código de cupom.', 'error');
                return;
            }

            btnAplicarCupom.disabled = true;
            btnAplicarCupom.textContent = 'Verificando...';

            try {
                const res = await fetch(`${API_URL}/validar_cupom`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, cupom }),
                });
                const data = await res.json();

                if (res.ok && data.valido) {
                    cupomValidado = data.cupom;
                    descontoAtual = data.desconto;
                    showCupomStatus(data.mensagem, 'success');
                    updateButtonPrice();
                } else {
                    cupomValidado = null;
                    descontoAtual = 0;
                    showCupomStatus(data.mensagem || 'Cupom inválido.', 'error');
                    updateButtonPrice();
                }
            } catch (err) {
                showCupomStatus('Erro ao verificar o cupom. Tente novamente.', 'error');
            } finally {
                btnAplicarCupom.disabled = false;
                btnAplicarCupom.textContent = 'Aplicar';
            }
        });
    }

    function showCupomStatus(msg, tipo) {
        if (!cupomStatus) return;
        cupomStatus.textContent = msg;
        cupomStatus.className = `cupom-status ${tipo}`;
        cupomStatus.hidden = false;
    }
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = inputNome.value.trim();
        const email = inputEmail.value.trim();
        const selectedPlan = Array.from(radiosPlan).find(r => r.checked)?.value;
        const pagamento = Array.from(radiosPagamento || []).find(r => r.checked)?.value || 'todos';

        if (!nome) {
            showMessage('Por favor, informe seu nome completo.', 'error');
            inputNome.focus();
            return;
        }
        if (!email || !inputEmail.checkValidity()) {
            showMessage('Por favor, preencha um e-mail válido.', 'error');
            inputEmail.focus();
            return;
        }
        if (!selectedPlan) {
            showMessage('Por favor, selecione um plano.', 'error');
            return;
        }

        toggleLoading(btnComprar, true);
        hideMessage();

        try {
            const payload = {
                nome,
                email,
                plan: selectedPlan,
                pagamento,
                cupom: cupomValidado || undefined,
            };

            const response = await fetch(`${API_URL}/create_preference`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.init_point) {
                if (data.desconto_aplicado > 0) {
                    showMessage(`${data.cupom_mensagem} Redirecionando para o pagamento...`, 'success');
                    setTimeout(() => { window.location.href = data.init_point; }, 1500);
                } else {
                    window.location.href = data.init_point;
                }
            } else {
                showMessage(data.error || 'Erro ao gerar checkout. Tente novamente.', 'error');
            }

        } catch (error) {
            console.error('[Checkout] Erro no pagamento:', error);
            showMessage('Erro de conexão com o servidor. Verifique sua internet.', 'error');
        } finally {
            toggleLoading(btnComprar, false);
        }
    });
    if (btnGratis) {
        btnGratis.addEventListener('click', async () => {
            const email = inputEmail.value.trim();

            if (!email || !inputEmail.checkValidity()) {
                showMessage('Por favor, preencha um e-mail válido para tentar a vaga grátis.', 'error');
                inputEmail.focus();
                return;
            }

            toggleLoading(btnGratis, true);
            hideMessage();

            try {
                const response = await fetch(`${API_URL}/claim_free_spot`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });

                const data = await response.json();

                if (response.ok) {
                    showMessage(data.message, 'success');

                    if (typeof data.vagas_restantes !== 'undefined') {
                        spanVagas.textContent = data.vagas_restantes;
                    }

                    btnGratis.disabled = true;
                    btnComprar.disabled = true;
                    inputNome.disabled = true;
                    inputEmail.disabled = true;

                } else {
                    showMessage(data.message || data.error, 'error');

                    if (response.status === 403) {
                        spanVagas.textContent = '0';
                        btnGratis.disabled = true;
                        btnGratis.querySelector('.btn-text').textContent = 'Vagas Esgotadas';
                    }
                }

            } catch (error) {
                console.error('[Checkout] Erro na vaga grátis:', error);
                showMessage('Falha ao comunicar com o servidor.', 'error');
            } finally {
                toggleLoading(btnGratis, false);
            }
        });
    }
    function toggleLoading(btn, isLoading) {
        const textSpan = btn.querySelector('.btn-text');
        const loader = btn.querySelector('.loader');

        btn.disabled = isLoading;
        textSpan.style.opacity = isLoading ? '0' : '1';
        loader.hidden = !isLoading;
    }

    function showMessage(text, type) {
        statusMsg.textContent = text;
        statusMsg.className = `mensagem ${type}`;
        statusMsg.hidden = false;
    }

    function hideMessage() {
        statusMsg.hidden = true;
    }
});
