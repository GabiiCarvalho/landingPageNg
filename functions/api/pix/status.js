import mercadopago from 'mercadopago';

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
});

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const url = new URL(req.url);
    const paymentId = url.searchParams.get('paymentId');

    if (!paymentId) {
      throw new Error('paymentId não informado');
    }

    const response = await mercadopago.payment.findById(paymentId);
    const payment = response.body;

    return new Response(
      JSON.stringify({
        success: true,
        status: payment.status, // 'approved', 'pending', 'rejected', 'cancelled'
        payment: {
          id: payment.id,
          status: payment.status,
          transaction_amount: payment.transaction_amount,
          date_approved: payment.date_approved
        }
      }),
      { headers, status: 200 }
    );

  } catch (error) {
    console.error('Erro ao consultar status:', error);
    return new Response(
      JSON.stringify({ success: false, erro: error.message }),
      { headers, status: 500 }
    );
  }
};