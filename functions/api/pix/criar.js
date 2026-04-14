import mercadopago from 'mercadopago';

// Configurar Mercado Pago com seu Access Token
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
});

export default async (req, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Responder preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, erro: 'Método não permitido' }),
      { headers, status: 405 }
    );
  }

  try {
    const { convId, valor, nomeCliente, descricao } = await req.json();

    // Validação
    if (!valor || valor <= 0) {
      throw new Error('Valor inválido');
    }

    // Criar pagamento PIX no Mercado Pago
    const payment = {
      transaction_amount: parseFloat(valor),
      description: descricao || `Entrega N&G Express - ${convId}`,
      payment_method_id: 'pix',
      payer: {
        email: `${convId}@ngexpress.com.br`,
        first_name: nomeCliente.split(' ')[0],
        last_name: nomeCliente.split(' ').slice(1).join(' ') || 'Cliente'
      },
      external_reference: convId,
      notification_url: `${process.env.URL || 'https://seu-site.netlify.app'}/api/pix/webhook`
    };

    console.log('📦 Criando pagamento PIX:', { valor, convId });

    const response = await mercadopago.payment.create(payment);
    const paymentData = response.body;

    console.log('✅ Pagamento criado:', { id: paymentData.id, status: paymentData.status });

    // 🔑 EXTRAIR OS DADOS DO QR CODE (parte mais importante!)
    const qrCode = paymentData.point_of_interaction?.transaction_data?.qr_code || null;
    const qrCodeBase64 = paymentData.point_of_interaction?.transaction_data?.qr_code_base64 || null;
    const ticketUrl = paymentData.point_of_interaction?.transaction_data?.ticket_url || null;

    if (!qrCode && !qrCodeBase64) {
      throw new Error('QR Code não retornado pelo Mercado Pago');
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: paymentData.id,
        qrCode: qrCode,              // String para gerar QR Code via JavaScript
        qrCodeBase64: qrCodeBase64,  // Imagem pronta em Base64
        ticketUrl: ticketUrl,
        status: paymentData.status
      }),
      { headers, status: 200 }
    );

  } catch (error) {
    console.error('❌ Erro ao criar pagamento:', error);
    
    let errorMessage = 'Erro ao gerar pagamento PIX';
    if (error.cause?.message) {
      errorMessage = error.cause.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({
        success: false,
        erro: errorMessage
      }),
      { headers, status: 500 }
    );
  }
};