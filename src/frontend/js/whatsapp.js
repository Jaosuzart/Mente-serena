const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const qrcodeCanvas = document.getElementById('qrcodeCanvas');
const qrLoader = document.getElementById('qrLoader');
const statusIndicator = document.querySelector('.status-indicator');

let lastQr = null;

const qrOptions = {
    width: 230,
    margin: 1,
    color: {
        dark: '#0f172a',
        light: '#ffffff'
    }
};

function updateStatusUI(statusClass, message) {
    statusIndicator.className = `status-indicator ${statusClass}`;
    statusText.textContent = message;
}

function renderQRCode(qrString) {
    if (qrString === lastQr) return;

    lastQr = qrString;
    qrLoader.style.display = 'none';
    qrcodeCanvas.style.display = 'block';

    QRCode.toCanvas(qrcodeCanvas, qrString, qrOptions, function (error) {
        if (error) console.error(error);
    });
}

let successContainer = null;

function showSuccessUI() {
    qrLoader.style.display = 'none';
    qrcodeCanvas.style.display = 'none';
    
    if (!successContainer) {
        successContainer = document.createElement('div');
        successContainer.style.textAlign = 'center';

        const icon = document.createElement('div');
        icon.textContent = '✓';
        icon.style.color = '#10b981';
        icon.style.fontSize = '60px';
        icon.style.marginTop = '50px';

        const text = document.createElement('p');
        text.textContent = 'Sessão Ativa';
        text.style.color = '#0f172a';
        text.style.marginTop = '20px';
        text.style.fontWeight = '600';

        successContainer.appendChild(icon);
        successContainer.appendChild(text);
        
        qrcodeCanvas.parentElement.appendChild(successContainer);
    }
    successContainer.style.display = 'block';
}

function hideSuccessUI() {
    if (successContainer) {
        successContainer.style.display = 'none';
    }
}

async function fetchStatus() {
    try {
        const response = await fetch('/api/whatsapp/status');
        const result = await response.json();

        if (!result.success) throw new Error(result.message);

        const { status, qr } = result.data;

        switch (status) {
            case 'DISCONNECTED':
            case 'LOGGED_OUT':
                updateStatusUI('status-error', 'Desconectado. Reinicie o servidor.');
                hideSuccessUI();
                qrLoader.style.display = 'block';
                qrcodeCanvas.style.display = 'none';
                break;
            case 'CONNECTING':
            case 'RECONNECTING':
                updateStatusUI('status-connecting', 'Conectando ao WhatsApp...');
                hideSuccessUI();
                qrLoader.style.display = 'block';
                qrcodeCanvas.style.display = 'none';
                break;
            case 'WAITING_QR':
                updateStatusUI('status-waiting', 'Aguardando leitura do QR Code...');
                hideSuccessUI();
                if (qr) renderQRCode(qr);
                break;
            case 'CONNECTED':
                updateStatusUI('status-connected', 'Dispositivo Conectado!');
                showSuccessUI();
                break;
            case 'ERROR':
                updateStatusUI('status-error', 'Erro na conexão.');
                break;
        }

    } catch (error) {
        console.error('Erro ao buscar status:', error);
        updateStatusUI('status-error', 'Servidor Offline');
    }
}

setInterval(fetchStatus, 3000);
fetchStatus();
