import API_BASE_URL from './apiConfig.js';

document.addEventListener('DOMContentLoaded', function() {
    if (typeof io === 'undefined') {
        console.error('Socket.io não carregado')
        return;
    }
    const socket = io();
    path: '/socket.io/';
    let currentChatId = null;
    
    // Carregar chats
    async function loadChats() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/chat`);
            const chats = await response.json();
            
            const chatList = document.getElementById('chat-list');
            chatList.innerHTML = '';
            
            chats.forEach(chat => {
                const chatItem = document.createElement('div');
                chatItem.className = 'chat-item';
                chatItem.dataset.chatId = chat._id;
                
                chatItem.innerHTML = `
                    <div class="chat-item-header">
                        <strong>${chat.clientName}</strong>
                        <span>${new Date(chat.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div>${chat.clientEmail}</div>
                    <div>${chat.clientPhone}</div>
                    <div class="unread-count" style="display: none;"></div>
                `;
                
                chatItem.addEventListener('click', () => selectChat(chat._id));
                chatList.appendChild(chatItem);
            });
        } catch (error) {
            console.error('Erro ao carregar chats:', error);
        }
    }
    
    // Selecionar chat
    async function selectChat(chatId) {
        currentChatId = chatId;
        
        // Marcar como ativo na lista
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.chatId === chatId) {
                item.classList.add('active');
            }
        });
        
        // Carregar mensagens
        await loadMessages(chatId);
        
        // Entrar no room do chat
        socket.emit('join_chat', chatId);
    }
    
    // Carregar mensagens
    async function loadMessages(chatId) {
        try {
            const response = await fetch(`/api/messages?chatId=${chatId}`);
            const messages = await response.json();
            
            const messagesContainer = document.getElementById('messages-container');
            messagesContainer.innerHTML = '';
            
            messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${msg.isAdmin ? 'admin-message' : 'client-message'}`;
                messageDiv.innerHTML = `
                    <div><strong>${msg.sender}</strong></div>
                    <div>${msg.content}</div>
                    <div style="font-size: 0.8em; color: #999; text-align: right;">
                        ${new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                `;
                messagesContainer.appendChild(messageDiv);
            });
            
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
        }
    }
    
    // Enviar mensagem - Corrigindo typo "ariaValueMax" para "value"
    document.getElementById('send-message').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    async function sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();
        
        if (message && currentChatId) {
            try {
                await fetch('/api/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        chatId: currentChatId,
                        sender: 'Admin',
                        content: message,
                        isAdmin: true
                    })
                });
                
                socket.emit('send_message', {
                    chatId: currentChatId,
                    sender: 'Admin',
                    content: message,
                    isAdmin: true
                });
                
                input.value = '';
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error);
            }
        }
    }
    
    // Receber novas mensagens
    socket.on('new_message', (message) => {
        if (message.chat.toString() === currentChatId) {
            const messagesContainer = document.getElementById('messages-container');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${message.isAdmin ? 'admin-message' : 'client-message'}`;
            messageDiv.innerHTML = `
                <div><strong>${message.sender}</strong></div>
                <div>${message.content}</div>
                <div style="font-size: 0.8em; color: #999; text-align: right;">
                    ${new Date(message.createdAt).toLocaleTimeString()}
                </div>
            `;
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else {
            // Mostrar notificação para chats não selecionados
            const chatItem = document.querySelector(`.chat-item[data-chat-id="${message.chat}"]`);
            if (chatItem) {
                const unreadCount = chatItem.querySelector('.unread-count');
                if (unreadCount) {
                    const count = parseInt(unreadCount.textContent) || 0;
                    unreadCount.textContent = count + 1;
                    unreadCount.style.display = 'inline-block';
                }
            }
        }
    });
    
    // Inicializar
    loadChats();
});