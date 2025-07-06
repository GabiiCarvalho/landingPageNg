const Quote = require('../models/Quote');
const { sendEmailNotification } = require('../services/emailService');
const { sendWhatsAppMessage } = require('../services/whatsappService');

exports.submitQuoteRequest = async (req, res) => {
    try {
        const { name,  email, phone, service, description } = req.body;

        // Salvar no MongoDB
        const newQuote = new Quote({ name, email, phone, service, description });
        await newQuote.save();

        // Enviar e-mail
        const emailText = `Nova solicitação de orçamento:\n\nNome: ${name}\nEmail: ${email}\nTelefone: ${phone}\nServiço: ${service}\nDescrição: ${description}`;
        await sendEmailNotification(process.env.ADMIN_EMAIL, 'Nova solicitação de orçamento', emailText);

        // Enviar WhatsApp
        const whatsappMsg = `Nova solicitação de orçamento:\n\nNome: ${name}\nTelefone: ${phone}\nServiço: ${service}\nDescrição: ${description.substring(0, 100)}...`;
        await sendWhatsAppMessage(whatsappMsg);

        res.status(201).json({ success: true, message: 'Solicitação de orçamento enviada com sucesso' });
    } catch (error) {
        console.error('Erro na solicitação de orçamento:', error);
        res.status(500).json({ success: false, message: 'Erro ao processar a solicitação' });
    }
};