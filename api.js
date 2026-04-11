// api.js - Cliente para comunicação com o backend PIX

const API_BASE_URL = window.location.origin; // ou 'http://localhost:3000' para desenvolvimento

// Função para gerar pagamento PIX
async function gerarPagamentoPIX(dados) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/pix/criar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                convId: dados.convId || `pedido_${Date.now()}`,
                valor: dados.valor,
                nomeCliente: dados.nomeCliente || 'Cliente',
                descricao: dados.descricao || 'Entrega N&G Express'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.erro || 'Erro ao gerar pagamento');
        }

        const data = await response.json();
        return {
            success: true,
            paymentId: data.paymentId,
            qrCode: data.qrCode,
            valor: data.valor,
            expiracao: data.expiracao
        };
    } catch (error) {
        console.error('Erro ao gerar PIX:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Função para verificar status do pagamento
async function verificarStatusPagamento(paymentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/pix/status/${paymentId}`);
        
        if (!response.ok) {
            throw new Error('Erro ao verificar status');
        }

        const data = await response.json();
        return {
            success: true,
            status: data.status,
            paymentId: data.paymentId
        };
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        return {
            success: false,
            status: 'error',
            error: error.message
        };
    }
}

// Função para gerar QR Code no frontend
function gerarQRCode(elementId, texto, options = {}) {
    const config = {
        width: options.width || 200,
        height: options.height || 200,
        colorDark: options.colorDark || "#FF6B00",
        colorLight: options.colorLight || "#1A1A24",
        correctLevel: QRCode.CorrectLevel.M
    };
    
    const container = document.getElementById(elementId);
    if (!container) return;
    
    container.innerHTML = '';
    new QRCode(container, {
        text: texto,
        width: config.width,
        height: config.height,
        colorDark: config.colorDark,
        colorLight: config.colorLight,
        correctLevel: config.correctLevel
    });
}

// Exportar funções
window.pixAPI = {
    gerarPagamento: gerarPagamentoPIX,
    verificarStatus: verificarStatusPagamento,
    gerarQRCode: gerarQRCode
};