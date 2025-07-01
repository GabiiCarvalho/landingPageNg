const Chat = require('../models/Chat');

exports.createChat = async (req, res) => {
    try {
        const { clientName, clientEmail, clientPhone, serviceType } = req.body;
        
        const chat = new Chat({
            clientName,
            clientEmail,
            clientPhone,
            serviceType
        });

        await chat.save();
        res.status(201).json(chat);
    } catch (error) {
        console.error('Erro ao criar chat:', error);
        res.status(500).json({ error: 'Erro ao criar chat' });
    }
};

exports.getChats = async (req, res) => {
    try {
        const chats = await Chat.find().sort({ createdAt: -1 });
        res.json(chats);
    } catch (error) {
        console.error('Erro ao buscar chats:', error);
        res.status(500).json({ error: 'Erro ao buscar chats' });
    }
};

exports.getChatById = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat) {
            return res.status(404).json({ error: 'Chat não encontrado' });
        }
        res.json(chat);
    } catch (error) {
        console.error('Erro ao buscar chat:', error);
        res.status(500).json({ error: 'Erro ao buscar chat' });
    }
};