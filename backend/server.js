// server.js - Atualizado

require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Config do MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado ao MongoDB');
}).catch(err => {
    console.error('Erro ao conectar ao MongoDB:', err);
});

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erro interno no servidor' });
});

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'comercial.ngexpress@gmail.com',
        pass: 'ng2016express'
    }
});

app.post('/api/send-email', async (req, res) => {
    try {
        const { formData, assunto } = req.body;
        
        const mailOptions = {
            from: formData.email,
            to: 'comercial.ngexpress@gmail.com',
            subject: assunto,
            text: `
                Nome: ${formData.nome}
                Email: ${formData.email}
                Telefone: ${formData.telefone}
                ${formData.servico ? `Serviço: ${formData.servico}` : ''}
                Mensagem: ${formData.mensagem || formData.descricao}
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
})

// Rotas API
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// Configuração de arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas principais
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});


// Socket.io para chat em tempo real
io.on('connection', (socket) => {
    console.log('Novo cliente conectado');

    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
    });

    socket.on('send_message', async (data) => {
        try {
            const Message = require('./models/Message');
            const message = new Message({
                chat: data.chatId,
                sender: data.sender,
                content: data.content,
                isAdmin: data.isAdmin
            });
            await message.save();

            io.to(data.chatId).emit('new_message', message);

            if (!data.isAdmin) {
                const Chat = require('./models/Chat');
                const chat = await Chat.findById(data.chatId);
                const transporter = require('./controllers/messageController').transporter;
                
                const emailContent = `Nova mensagem no chat ${data.chatId}:\n\n` +
                    `Cliente: ${chat.clientName}\n` +
                    `Email: ${chat.clientEmail}\n` +
                    `Telefone: ${chat.clientPhone}\n\n` +
                    `Mensagem: ${data.content}`;

                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: process.env.ADMIN_EMAIL,
                    subject: `Nova mensagem no chat ${data.chatId}`,
                    text: emailContent
                });
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));