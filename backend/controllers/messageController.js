const Message = require('../models/Message');
const Chat = require('../models/Chat');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.createMessage = async (req, res) => {
    try {
        const { chatId, sender, content, isAdmin } = req.body;
        
        const message = new Message({
            chat: chatId,
            sender,
            content,
            isAdmin
        });

        await message.save();
        
        // Atualizar último contato do chat
        await Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() });
        
        res.status(201).json(message);
    } catch (error) {
        console.error('Erro ao criar mensagem:', error);
        res.status(500).json({ error: 'Erro ao criar mensagem' });
    }
};

exports.getMessagesByChat = async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.query.chatId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
};

exports.notifyAdmin = async (req, res) => {
    try {
        const { chatId, message } = req.body;
        
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ error: 'Chat não encontrado' });
        }

        const emailContent = `Nova mensagem no chat ${chatId}:\n\nCliente: ${chat.clientName}\nEmail: ${chat.clientEmail}\nTelefone: ${chat.clientPhone}\nMensagem: ${message}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: `Nova mensagem no chat ${chatId}`,
            text: emailContent
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao notificar admin:', error);
        res.status(500).json({ error: 'Erro ao notificar admin' });
    }
};