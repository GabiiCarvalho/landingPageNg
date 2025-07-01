const Chat = require('../models/Chat');
const Message = require('../models/Message');
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.post('/', messageController.createMessage);
router.get('/', messageController.getMessagesByChat);
router.post('/notify', messageController.notifyAdmin);

// Rotas para formulários (substituindo o EmailJS)
router.post('/contact', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        
        // Criar um novo chat para este contato
        const chat = new Chat({
            clientName: name,
            clientEmail: email,
            clientPhone: phone,
            serviceType: 'Contato do Site'
        });
        await chat.save();
        
        // Criar mensagem inicial
        const initialMessage = new Message({
            chat: chat._id,
            sender: name,
            content: message,
            isAdmin: false
        });
        await initialMessage.save();
        
        // Notificar admin
        await messageController.notifyAdmin({
            body: {
                chatId: chat._id,
                message: `Nova mensagem de contato:\n${message}`
            }
        }, res);
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Erro ao processar contato:', error);
        res.status(500).json({ error: 'Erro ao processar contato' });
    }
});

router.post('/quote', async (req, res) => {
    try {
        const { name, email, phone, service, description } = req.body;
        
        // Criar um novo chat para este orçamento
        const chat = new Chat({
            clientName: name,
            clientEmail: email,
            clientPhone: phone,
            serviceType: service
        });
        await chat.save();
        
        // Criar mensagem inicial
        const initialMessage = new Message({
            chat: chat._id,
            sender: name,
            content: `Solicitação de orçamento para ${service}:\n${description}`,
            isAdmin: false
        });
        await initialMessage.save();
        
        // Notificar admin
        await messageController.notifyAdmin({
            body: {
                chatId: chat._id,
                message: `Nova solicitação de orçamento para ${service}:\n${description}`
            }
        }, res);
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Erro ao processar orçamento:', error);
        res.status(500).json({ error: 'Erro ao processar orçamento' });
    }
});

module.exports = router;