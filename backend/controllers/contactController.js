const Contact = require('../models/Contact');
const { sendEmailNotification } = require('../services/emailService');
const { sendWhatsAppMessage } = require('../services/whatsappService');

exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Salvar no MongoDB
    const newContact = new Contact({ name, email, phone, message });
    await newContact.save();

    // Enviar e-mail
    const emailText = `Nova mensagem de contato:\n\nNome: ${name}\nEmail: ${email}\nTelefone: ${phone}\nMensagem: ${message}`;
    await sendEmailNotification(process.env.ADMIN_EMAIL, 'Nova mensagem do site', emailText);

    // Enviar WhatsApp
    const whatsappMsg = `Nova mensagem do site:\n\nNome: ${name}\nTel: ${phone}\nEmail: ${email}\nMsg: ${message.substring(0, 100)}...`;
    await sendWhatsAppMessage(whatsappMsg);

    res.status(201).json({ success: true, message: 'Mensagem enviada com sucesso' });
  } catch (error) {
    console.error('Erro no formulário de contato:', error);
    res.status(500).json({ success: false, message: 'Erro ao processar a mensagem' });
  }
};