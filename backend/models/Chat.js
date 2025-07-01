const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhone: { type: String, required: true },
    serviceType: { type: String },
    status: { type: String, default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema);