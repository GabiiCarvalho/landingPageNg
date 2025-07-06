const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const adminPhoneNumber = process.env.ADMIN_PHONE_NUMBER;

const client = new twilio(accountSid, authToken);

const sendWhatsAppMessage = async (message) => {
    try {
        await client.messages.create({
            body: message,
            from: `whatsapp:${twilioPhoneNumber}`,
            to: `whatsapp:${adminPhoneNumber}`
        });
        console.log('Mensagem do WhatsApp enviada com sucesso');
    } catch (error) {
        console.error("Erro ao enviar mensagem do WhatsApp", error);
        throw error;
    }
};

module.exports = { sendWhatsAppMessage };