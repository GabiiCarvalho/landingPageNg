// server.js - Servidor para geração de QR Code PIX
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações do PIX
const PIX_CONFIG = {
    chavePix: 'comercial.ngexpress@gmail.com',
    nomeRecebedor: 'N&G Express',
    cidade: 'SAO PAULO',
    descricaoPadrao: 'Entrega N&G Express'
};

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Função para calcular CRC16 do payload PIX
function calcularCRC16(payload) {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

// Função para gerar payload PIX estático
function gerarPayloadPIX(valor, descricao, convId) {
    const { chavePix, nomeRecebedor, cidade } = PIX_CONFIG;
    const valorFormatado = valor.toFixed(2).replace('.', '');
    const descricaoFormatada = descricao || `${PIX_CONFIG.descricaoPadrao} #${convId?.slice(-6) || Date.now().toString().slice(-6)}`;
    
    // Montagem do payload PIX conforme padrão BR Code
    let payload = '000201'; // Payload Format Indicator
    payload += '26'; // Merchant Account Information
    payload += '0014br.gov.bcb.pix'; // GUI
    payload += `01${String(chavePix.length).padStart(2, '0')}${chavePix}`; // Chave PIX
    payload += '52040000'; // Merchant Category Code
    payload += '5303986'; // Transaction Currency (BRL)
    payload += `54${String(valorFormatado.length).padStart(2, '0')}${valorFormatado}`; // Transaction Amount
    payload += '5802BR'; // Country Code
    payload += `59${String(nomeRecebedor.length).padStart(2, '0')}${nomeRecebedor}`; // Merchant Name
    payload += `60${String(cidade.length).padStart(2, '0')}${cidade}`; // Merchant City
    payload += `62${String(descricaoFormatada.length + 5).padStart(2, '0')}05${String(descricaoFormatada.length).padStart(2, '0')}${descricaoFormatada}`; // Additional Data Field
    payload += '6304'; // CRC16 Field
    
    const crc = calcularCRC16(payload);
    return payload + crc;
}

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pagamento.html'));
});

// Rota para gerar QR Code PIX
app.post('/api/pix/criar', async (req, res) => {
    const { convId, valor, nomeCliente, descricao } = req.body;
    
    // Validações
    if (!valor || valor <= 0) {
        return res.status(400).json({ 
            success: false, 
            erro: 'Valor do pagamento é obrigatório' 
        });
    }
    
    try {
        // Gerar payload PIX
        const pixPayload = gerarPayloadPIX(
            parseFloat(valor), 
            descricao || `Entrega ${nomeCliente || 'Cliente'} #${convId?.slice(-6) || Date.now().toString().slice(-6)}`,
            convId
        );
        
        // Gerar QR Code (aqui você pode integrar com API de QR Code se quiser)
        // Por enquanto retornamos apenas o payload e o frontend gera o QR
        
        const response = {
            success: true,
            paymentId: `pix_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            qrCode: pixPayload,
            qrCodeBase64: null, // Será gerado pelo frontend
            valor: parseFloat(valor),
            convId: convId || `pedido_${Date.now()}`,
            expiracao: new Date(Date.now() + 3600000).toISOString() // 1 hora
        };
        
        console.log(`✅ PIX gerado para ${nomeCliente || 'Cliente'} - Valor: R$ ${valor}`);
        res.json(response);
        
    } catch (error) {
        console.error('❌ Erro ao gerar PIX:', error);
        res.status(500).json({ 
            success: false, 
            erro: 'Erro ao gerar pagamento PIX. Tente novamente.' 
        });
    }
});

// Rota para verificar status do pagamento (simulada)
app.get('/api/pix/status/:paymentId', async (req, res) => {
    const { paymentId } = req.params;
    
    // Simulação - em produção, isso viria do banco de dados ou webhook do Mercado Pago
    // Por enquanto, retorna sempre como pendente
    
    res.json({
        status: 'pending',
        paymentId: paymentId,
        message: 'Aguardando pagamento'
    });
});

// Rota para webhook (simulada - em produção integrar com Mercado Pago)
app.post('/api/pix/webhook', async (req, res) => {
    console.log('📨 Webhook recebido:', req.body);
    res.sendStatus(200);
});

// Rota health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        pixConfig: {
            chave: PIX_CONFIG.chavePix,
            nome: PIX_CONFIG.nomeRecebedor
        }
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('');
    console.log('🚚 N&G Express - Servidor PIX');
    console.log(`📡 Rodando em: http://localhost:${PORT}`);
    console.log(`💳 Endpoint PIX: http://localhost:${PORT}/api/pix/criar`);
    console.log(`🔧 Health Check: http://localhost:${PORT}/api/health`);
    console.log('');
    console.log(`🔑 Chave PIX: ${PIX_CONFIG.chavePix}`);
    console.log(`🏢 Recebedor: ${PIX_CONFIG.nomeRecebedor}`);
    console.log('');
});