require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');

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
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Rota para o admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Rotas backend
app.get('/api/test', (req, res) => {
    res.json({ message: "Backend funcionando!" });
});

// Rota para o painel admin
app.get('/admin*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// Rota para a landing page
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
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
            // Salvar mensagem no BD
            const message = new Message({
                chat: data.chatId,
                sender: data.sender,
                content: data.content,
                isAdmin: data.isAdmin
            });
            await message.save();

            // Enviar para todos no chat
            io.to(data.chatId).emit('new_message', message);

            // Se for do cliente, notificar admin por email
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