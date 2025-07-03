document.addEventListener('DOMContentLoaded', function () {
    // Elementos do Chat Widget
    const chatWidget = createChatWidget();
    const style = createChatStyles();
    const chatToggle = createChatToggle();
    const chatModal = createChatModal();

    document.body.appendChild(chatWidget);
    document.head.appendChild(style);
    document.body.appendChild(chatToggle);
    document.body.appendChild(chatModal);

    // Socket.io client
    const socket = io();
    let currentChatId = null;

    // Funções auxiliares
    function formatPhone(phone) {
        return phone.replace(/\D/g, '');
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showChatWidget() {
        document.getElementById('ng-chat-widget').style.display = 'flex';
        chatModal.style.display = 'none';
    }

    // Máscara de telefone melhorada
    function setupPhoneMask() {
        const phoneInput = document.getElementById('client-phone');
        phoneInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');

            // Limita a 11 dígitos
            if (value.length > 11) {
                value = value.substring(0, 11);
            }

            // Aplica a máscara
            if (value.length > 0) {
                value = value.replace(/^(\d{0,2})/, '($1');
            }
            if (value.length > 3) {
                value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
            }
            if (value.length > 9) {
                value = value.replace(/(\d{5})(\d{0,4})/, '$1-$2');
            }

            e.target.value = value;
        });
    }

    // Validação dos dados do formulário
    function validateFormData(data) {
        const errors = [];

        if (!data.name || data.name.length < 3) {
            errors.push('Nome deve ter pelo menos 3 caracteres');
        }

        if (!validateEmail(data.email)) {
            errors.push('Por favor, insira um e-mail válido');
        }

        const phoneDigits = formatPhone(data.phone);
        if (!phoneDigits || phoneDigits.length < 10 || phoneDigits.length > 11) {
            errors.push('Telefone deve ter DDD + 8 ou 9 dígitos');
        } else if (!/^\d+$/.test(phoneDigits)) {
            errors.push('Apenas números são permitidos no telefone');
        }

        return errors;
    }

    // Event Listeners
    chatToggle.addEventListener('click', function () {
        const chatWidget = document.getElementById('ng-chat-widget');

        if (chatWidget.style.display === 'flex') {
            chatWidget.style.display = 'none';
            return;
        }

        if (!currentChatId) {
            chatModal.style.display = 'flex';
            document.getElementById('client-name').focus();
        } else {
            showChatWidget();
        }
    });

    document.getElementById('start-chat-btn').addEventListener('click', async function () {
        const clientData = {
            name: document.getElementById('client-name').value.trim(),
            email: document.getElementById('client-email').value.trim(),
            phone: document.getElementById('client-phone').value.replace(/\D/g, '')
        };

        if (!clientData.phone || clientData.phone.length < 10 || clientData.phone.length > 11) {
            alert('Telefone deve ter DDD + 8 ou 9 dígitos');
            return;
        }

        const validationErrors = validateFormData(clientData);

        if (validationErrors.length > 0) {
            alert(validationErrors.join('\n'));
            return;
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientName: clientData.name,
                    clientEmail: clientData.email,
                    clientPhone: clientData.phone,
                    serviceType: 'Site'
                })
            });

            const responseData = await response.json();

            if (!response.ok) {
                const errorMsg = responseData.details?.[0]?.msg || responseData.error || 'Erro desconhecido';
                throw new Error(errorMsg);
            }

            currentChatId = responseData._id;
            socket.emit('join_chat', currentChatId);
            showChatWidget();

        } catch (error) {
            console.error('Erro ao iniciar chat:', error);
            alert(`Falha ao iniciar chat: ${error.message}`);
        }
    });

    function setupMessageSending() {
        document.getElementById('send-message').addEventListener('click', sendMessage);
        document.getElementById('chat-input').addEventListener('keypress', function (e) {
            if (e.key === 'Enter') sendMessage();
        });
    }

    async function sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();

        if (!message || !currentChatId) return;

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatId: currentChatId,
                    sender: 'Cliente',
                    content: message,
                    isAdmin: false
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao enviar mensagem');
            }

            // Adiciona a mensagem localmente imediatamente
            addMessageToChat({
                sender: 'Cliente',
                content: message,
                isAdmin: false,
                createdAt: new Date()
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
            alert('Erro ao enviar mensagem. Tente novamente.');
        }
    }

    function addMessageToChat(message) {
        const chatBody = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.isAdmin ? 'admin-message' : 'client-message'}`;

        const messageContent = document.createElement('div');
        messageContent.innerHTML = `
            <div><strong>${message.sender}</strong></div>
            <div>${message.content}</div>
            <div style="font-size: 0.8em; color: #999; text-align: right;">
                ${new Date(message.createdAt).toLocaleTimeString()}
            </div>
        `;

        messageDiv.appendChild(messageContent);
        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    socket.on('new_message', (message) => {
        if (message.chat.toString() === currentChatId) {
            addMessageToChat(message);
        }
    });

    document.getElementById('close-chat').addEventListener('click', () => {
        document.getElementById('ng-chat-widget').style.display = 'none';
    });

    // Inicialização
    setupPhoneMask();
    setupMessageSending();

    // Funções de criação de elementos
    function createChatWidget() {
        const widget = document.createElement('div');
        widget.id = 'ng-chat-widget';
        widget.innerHTML = `
            <div class="chat-header">
                <span>Chat N&G EXPRESS</span>
                <button id="close-chat">X</button>
            </div>
            <div class="chat-body" id="chat-messages"></div>
            <div class="chat-input">
                <input type="text" id="chat-input" placeholder="Digite sua mensagem">
                <button id="send-message">Enviar</button>
            </div>
        `;
        return widget;
    }

    function createChatStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Seus estilos permanecem os mesmos */
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
            /* ... outros estilos ... */
        `;
        return style;
    }

    function createChatToggle() {
        const toggle = document.createElement('div');
        toggle.id = 'chat-toggle';
        toggle.innerHTML = '<i class="fas fa-comments"></i>';
        return toggle;
    }

    function createChatModal() {
        const modal = document.createElement('div');
        modal.className = 'chat-modal';
        modal.innerHTML = `
            <div class="chat-modal-content">
                <h3>Iniciar Chat</h3>
                <input type="text" id="client-name" placeholder="Seu nome completo" required>
                <input type="email" id="client-email" placeholder="Seu e-mail" required>
                <input type="tel" id="client-phone" placeholder="Seu telefone (com DDD)" required>
                <button id="start-chat-btn">Iniciar Chat</button>
            </div>
        `;
        return modal;
    }
});