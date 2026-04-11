// server.js - Servidor para geração de QR Code PIX com Mercado Pago
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const { v4: uuid } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações do Mercado Pago
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

console.log('🔑 MP_ACCESS_TOKEN:', MP_ACCESS_TOKEN ? '✅ Configurado' : '❌ NÃO CONFIGURADO');
console.log('🌐 BASE_URL:', BASE_URL);

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Função para fazer requisições ao Mercado Pago
function mpRequest(method, endpoint, body) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'api.mercadopago.com',
            path: endpoint,
            method: method,
            headers: {
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': uuid(),
            }
        };
        if (data) options.headers['Content-Length'] = Buffer.byteLength(data);
        
        const req = https.request(options, (res) => {
            let raw = '';
            res.on('data', chunk => raw += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(raw) });
                } catch (e) {
                    reject(new Error('Resposta inválida do Mercado Pago: ' + raw.slice(0, 200)));
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

// Rota para gerar QR Code PIX via Mercado Pago
app.post('/api/pix/criar', async (req, res) => {
    const { convId, valor, nomeCliente } = req.body;
    
    if (!valor || valor <= 0) {
        return res.status(400).json({ erro: 'Valor do pagamento é obrigatório' });
    }

    try {
        const mpBody = {
            transaction_amount: parseFloat(parseFloat(valor).toFixed(2)),
            description: `Entrega N&G Express #${convId?.slice(-6) || Date.now().toString().slice(-6)}`,
            payment_method_id: 'pix',
            payer: {
                email: 'cliente@ngexpress.com.br',
                first_name: nomeCliente || 'Cliente',
                last_name: 'NGExpress',
                identification: { type: 'CPF', number: '00000000000' }
            },
            external_reference: convId || `pedido_${Date.now()}`
        };

        console.log('📤 Criando PIX no Mercado Pago:', JSON.stringify(mpBody));
        
        const resp = await mpRequest('POST', '/v1/payments', mpBody);
        console.log('📥 Resposta MP:', resp.status);

        if (resp.status !== 201) {
            return res.status(502).json({ 
                erro: 'Erro no Mercado Pago', 
                detalhe: resp.body 
            });
        }

        const pix = resp.body.point_of_interaction?.transaction_data;
        if (!pix?.qr_code) {
            return res.status(502).json({ erro: 'MP não retornou QR Code PIX' });
        }

        res.json({
            success: true,
            paymentId: resp.body.id,
            qrCode: pix.qr_code,
            qrCodeBase64: pix.qr_code_base64 || null,
            valor: resp.body.transaction_amount
        });

    } catch (err) {
        console.error('❌ Erro criar PIX:', err.message);
        res.status(500).json({ erro: err.message });
    }
});

// Rota para consultar status do pagamento
app.get('/api/pix/status/:paymentId', async (req, res) => {
    const { paymentId } = req.params;
    
    try {
        const resp = await mpRequest('GET', `/v1/payments/${paymentId}`, null);
        if (resp.status !== 200) {
            return res.status(502).json({ erro: 'Erro ao consultar MP' });
        }
        res.json({ 
            status: resp.body.status, 
            valor: resp.body.transaction_amount,
            paymentId: paymentId
        });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Rota health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        mpConfigured: !!MP_ACCESS_TOKEN
    });
});

// Servir arquivos estáticos
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'novo-pedido.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('');
    console.log('🚚 N&G Express - Servidor PIX');
    console.log(`📡 Rodando em: http://localhost:${PORT}`);
    console.log(`💳 Endpoint PIX: http://localhost:${PORT}/api/pix/criar`);
    console.log(`🔧 Health Check: http://localhost:${PORT}/api/health`);
    console.log('');
    console.log(`🔑 MP_ACCESS_TOKEN: ${MP_ACCESS_TOKEN ? '✅ Configurado' : '❌ NÃO CONFIGURADO'}`);
    console.log('');
});