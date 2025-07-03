const Chat = require('../models/Chat');
const { body, validationResult } = require('express-validator');

exports.validateChat = [
    body('clientName')
        .trim()
        .notEmpty().withMessage('Nome é obrigatório')
        .isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres'),

     body('clientEmail')
        .trim()
        .notEmpty().withMessage('E-mail é obrigatório')
        .isEmail().withMessage('E-mail inválido'),

    body('clientPhone')
        .notEmpty().withMessage('Telefone é obrigatório')
        .isString().withMessage('Telefone deve ser texto')
        .custom(value => {
            const phone = value.replace(/\D/g, '');
            
            // Verifica se tem apenas números
            if (!/^\d+$/.test(phone)) {
                throw new Error('Apenas números são permitidos');
            }
            
            // Verifica o comprimento
            if (phone.length < 10 || phone.length > 11) {
                throw new Error('DDD + 8 ou 9 dígitos');
            }
            
            // Verifica DDD válido (11-99)
            const ddd = phone.substring(0, 2);
            if (ddd < 11 || ddd > 99) {
                throw new Error('DDD inválido');
            }
            
            return true;
        }),
];

exports.createChat = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Dados inválidos',
            details: errors.array(),
            suggestion: 'Formato esperado: {clientName: string, clientEmail: email, clientPhone: números com DDD}'
        });
    }

    try {
        const { clientName, clientEmail, clientPhone } = req.body;

        const chat = new Chat({
            clientName,
            clientEmail,
            clientPhone,
            serviceType: req.body.serviceType || 'Site'
        });

        await chat.save();
        res.status(201).json(chat);
    } catch (error) {
        console.error('Erro ao criar chat:', error);
        res.status(500).json({
            error: 'Erro interno',
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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