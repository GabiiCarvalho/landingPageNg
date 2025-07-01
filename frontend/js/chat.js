document.addEventListener('DOMContentLoaded', function() {
    const chatWidget = document.createElement('div');
    chatWidget.id = 'ng-chat-widget';
    chatWidget.innerHTML = `
        <div class="chat-header">
            <span> Chat N&G EXPRESS</span>
            <button id="close-chat">X</button>
        </div>
        <div class="chat-body" id="chat-messages"></div>
        <div class="chat-input">
            <input type="text" id="chat-input" placeholder="Digite sua mensagem">
            <button id="send-message">Enviar</button>
        </div>
    `;
    document.body.appendChild(chatWidget);

    // Estilo dinâmico
    const style = document.createElement('style');
    style.textContent = `
        #ng-chat-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 0 15px rgba(0,0,0,0.2);
            z-index: 1000;
            display: none;
            flex-direction: column;
            height: 400px;
        }
        .chat-header {
            background: #2c3e50;
            color: white;
            padding: 10px;
            border-radius: 10px 10px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .chat-body {
            flex-grow: 1;
            overflow-y: auto;
            padding: 10px;
        }
        .chat-input {
            display: flex;
            padding: 10px;
            border-top: 1px solid #eee;
        }
        #chat-input {
            flex-grow: 1;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        #send-message {
            margin-left: 10px;
            padding: 8px 15px;
            background: #2c3e50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .message {
            margin-bottom: 10px;
            padding: 8px;
            border-radius: 5px;
            max-width: 80%;
        }
        .client-message {
            background: #e3f2fd;
            margin-left: auto;
        }
        .admin-message {
            background: #f1f1f1;
            margin-right: auto;
        }
        #chat-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #2c3e50;
            color: white;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
            z-index: 999;
        }
    `;
    document.head.appendChild(style);

    // Btn toggle
    const chatToggle = document.createElement('div');
    chatToggle.id = 'chat-toggle';
    chatToggle.innerHTML = '<i class="fas fa fa-comments"></i>';
    document.body.appendChild(chatToggle);

    // Socket.io client
    const socket = io();
    let currentChatId = null;

    // Iniciar chat quando cliente clicar no botão
    chatToggle.addEventListener('click', async() => {
        if (document.getElementById('ng-chat-widget').style.display === 'flex') {
            document.getElementById('ng-chat-widget').style.display === 'none';
            return;
        }

        // Verificar se já tem um chat ativo
        if ("currentChatId") {
            const clientName = prompt('Por favor, digite seu nome:');
            const clientEmail = prompt('Por favor, digite seu e-mail:');
            const clientPhone = prompt('Por favor, digite seu telefone:');

            try {
                const responde = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        clientName,
                        clientEmail,
                        clientPhone
                    })
                });

                const data = await responde.json();
                currentChatId = data._id;
                socket.emit('join_chat', currentChatId);

                // Enviar notificação por email
                await fetch('/api/messages/notify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        chatId: currentChatId,
                        message: 'O cliente iniciou um novo chat'
                    })
                });

                showChatWidget();
            } catch (error) {
                console.error('Erro ao criar chat:', error);
                alert('Erro ao iniciar o chat, por favor, tente novamente.');
            }
        } else {
            showChatWidget();
        }
    });

    function showChatWidget() {
        document.getElementById('ng-chat-widget').style.display = 'flex';
        loadMessages();
    }

    async function loadMessages() {
        if (!currentChatId) return;

        try {
            const responde = await fetch(`/api/messages?chatId=${currentChatId}`);
            const messages = await responde.json();

            const chatBody = document.getElementById('chat-messages');
            chatBody.innerHTML = '';

            messages.forEache(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${msg.isAdmin ? 'admin-message' : 'client-message'}`;
                messageDiv.textContent = msg.content;
                chatBody.appendChild(messageDiv);
            });

            chatBody.scrollTop = chatBody.scrollHeight;
        } catch (error) {
            console.error('Erroo ao carregar mensagens:', error);
        }
    }

    // Enviar mensagem
    document.getElementById('send-message').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    async function sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.ariaValueMax.trim();

        if (message && currentChatId) {
            try {
                await fetch('/api/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        chatId: currentChatId,
                        sender: 'Cliente',
                        content: message,
                        isAdmin: false
                    })
                });

                socket.emit('send_message', {
                    chatId: currentChatId,
                    sender: 'Cliente',
                    content: message,
                    isAdmin: false
                });

                input.value = '';                
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error);
            }
        }
    }

    //Receber novas mensagens
    socket.on('new_message', (message) => {
        if (message.chat.toString() === currentChatId) {
            const chatBody = document.getElementById('chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${message.isAdmin ? 'admin-message' : 'client-message'}`;
            messageDiv.textContent = message.content;
            chatBody.appendChild(messageDiv);
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    });

    // Fechar chat
    document.getElementById('close-chat').addEventListener('click', () => {
        document.getElementById('ng-chat-widget').style.display = 'none';
    });
});