const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    clientName: {
        type: String,
        required: [true, 'O nome do cliente é obrigatório'],
        trim: true
    },
    clientEmail: {
        type: String,
        required: [true, 'O e-mail do cliente é obrigatório'],
        trim: true
    },
    clientPhone: {
        type: String,
        required: [true, 'Telefone é obrigatório'],
        validate: {
            validator: function(v) {
                return /^\d{10,11}$/.test(v);
            },
            message: 'Telefone deve ter 10 ou 11 dígitos'
        },
        set: v => v.replace(/\D/g, '')
    },
    serviceType: {
        type: String,
        default: 'Site'
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'closed', 'archived']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Chat', chatSchema);