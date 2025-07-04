import API_BASE_URL from './apiConfig.js';

document.addEventListener('DOMContentLoaded', function () {

    // Menu Mobile - Com verificação de existência
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.innerHTML = navLinks.classList.contains('active') ?
                '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
        });

        // Fechar menu ao clicar em um link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                if (mobileMenuBtn) {
                    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                }
            });
        });
    }

    // Scroll suave para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    document.addEventListener('DOMContentLoaded', function () {
        // Criação do widget de chat
        const chatWidget = document.createElement('div');
        chatWidget.id = 'ng-chat-widget';
        chatWidget.innerHTML = `
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
        document.body.appendChild(chatWidget);

        // Estilos dinâmicos
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
            word-wrap: break-word;
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

        // Botão de toggle do chat
        const chatToggle = document.createElement('div');
        chatToggle.id = 'chat-toggle';
        chatToggle.innerHTML = '<i class="fas fa-comments"></i>';
        document.body.appendChild(chatToggle);

        // Inicialização do Socket.io
        const socket = io();
        let currentChatId = null;

        // Função para mostrar/ocultar o chat
        chatToggle.addEventListener('click', async () => {
            const chatWidget = document.getElementById('ng-chat-widget');
            if (chatWidget.style.display === 'flex') {
                chatWidget.style.display = 'none';
                return;
            }

            if (!currentChatId) {
                const clientName = prompt('Por favor, digite seu nome:');
                const clientEmail = prompt('Por favor, digite seu e-mail:');
                const clientPhone = prompt('Por favor, digite seu telefone:');

                if (!clientName || !clientEmail || !clientPhone) {
                    return;
                }

                try {
                    const response = await fetch(`${API_BASE_URL}/api/chat`, {
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

                    const data = await response.json();
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
                const response = await fetch(`/api/messages?chatId=${currentChatId}`);
                const messages = await response.json();

                const chatBody = document.getElementById('chat-messages');
                chatBody.innerHTML = '';

                messages.forEach(msg => {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = `message ${msg.isAdmin ? 'admin-message' : 'client-message'}`;

                    const messageContent = document.createElement('div');
                    messageContent.innerHTML = `
                    <div><strong>${msg.sender}</strong></div>
                    <div>${msg.content}</div>
                    <div style="font-size: 0.8em; color: #999; text-align: right;">
                        ${new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                `;

                    messageDiv.appendChild(messageContent);
                    chatBody.appendChild(messageDiv);
                });

                chatBody.scrollTop = chatBody.scrollHeight;
            } catch (error) {
                console.error('Erro ao carregar mensagens:', error);
            }
        }

        // Enviar mensagem
        document.getElementById('send-message').addEventListener('click', sendMessage);
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        async function sendMessage() {
            const input = document.getElementById('chat-input');
            const message = input.value.trim();

            if (message && currentChatId) {
                try {
                    const response = await fetch('/api/messages', {
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

                    const newMessage = await response.json();

                    socket.emit('send_message', {
                        chatId: currentChatId,
                        sender: 'Cliente',
                        content: message,
                        isAdmin: false,
                        createdAt: new Date()
                    });

                    input.value = '';

                    // Adiciona a mensagem enviada ao chat
                    const chatBody = document.getElementById('chat-messages');
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message client-message';

                    const messageContent = document.createElement('div');
                    messageContent.innerHTML = `
                    <div><strong>Cliente</strong></div>
                    <div>${message}</div>
                    <div style="font-size: 0.8em; color: #999; text-align: right;">
                        ${new Date().toLocaleTimeString()}
                    </div>
                `;

                    messageDiv.appendChild(messageContent);
                    chatBody.appendChild(messageDiv);
                    chatBody.scrollTop = chatBody.scrollHeight;
                } catch (error) {
                    console.error('Erro ao enviar mensagem:', error);
                }
            }
        }

        socket.on('new-message', (message) => {
            if (message.chat.toString() === currentChatId) {
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
        });

        document.getElementById('close-chat').addEventListener('click', () => {
            document.getElementById('ng-chat-widget').style.display = 'none';
        });

        // Scroll suave para os serviços
        document.querySelectorAll('.footer-links a[href^="#servico-"]').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();

                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100,
                        behavior: 'smooth'
                    });

                    const serviceType = targetId.replace('#servico-', '');
                    const detailsDiv = document.getElementById(`${serviceType}-details`);
                    const saibaMaisBtn = document.querySelector(`.saiba-mais-btn[data-service="${serviceType}"]`);

                    if (detailsDiv && saibaMaisBtn) {
                        detailsDiv.style.display = 'block';
                        saibaMaisBtn.textContent = 'Mostrar Menos';
                    }
                }
            });
        });

        document.getElementById('quote-btn-footer').addEventListener('click', function (e) {
            e.preventDefault();
            document.getElementById('quote-servico').value = 'outro';
            document.getElementById('quote-modal').classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        // Back to Top - Com verificação
        const backToTop = document.querySelector('.back-to-top');
        if (backToTop) {
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 300) {
                    backToTop.classList.add('active');
                } else {
                    backToTop.classList.remove('active');
                }
            });

            backToTop.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }

        // Modal - Com verificações
        const quoteBtn = document.getElementById('quote-btn');
        const contactBtn = document.getElementById('contact-btn');
        const ctaBtn = document.getElementById('cta-btn');
        const modal = document.getElementById('quote-modal');
        const closeModal = document.querySelector('.close-modal');

        function openModal() {
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }

        function closeModalFunc() {
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        }

        if (quoteBtn) quoteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });

        if (contactBtn) contactBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });

        if (ctaBtn) ctaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });

        if (closeModal) closeModal.addEventListener('click', closeModalFunc);

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModalFunc();
                }
            });
        }

        // Dados detalhados dos serviços
        const services = {
            motoboy: {
                title: "Entregas de Motoboy",
                img: "img/entregaDemoto.jpeg",
                description: `
                        <p>Serviço ideal para entregas urgentes de documentos, pequenos pacotes e encomendas leves em toda a região de Camboriú e cidades vizinhas.</p>
                            <p><strong>Características técnincas:</strong></p>
                            <p>• Capacidade: Pacotes até 5kg e 30x30x30cm<br>
                               • Área de cobertura: 50km de raio a partir de Camboriú<br>
                               • Horário: Seg-Sex: 9h-18h Sab: 10h-16h (Em caso de feriado ou fora de horário, valor pode sofrer alteração)<br>
                               • Exemplos: Documentos, medicamentos, pequenas encomendas, alimentos, peças de veículos.</p>
                    `,
                benefits: [
                    "Entrega super rápida (30-90 minutos na região central)",
                    "Rastreamento em tempo real via WhatsApp",
                    "Motoboys identificados",
                    "Seguro básico incluso para documentos",
                    "Recebimento de assinatura e comprovante foto"
                ],
                pricing: `
                        <p><strong>Tabela de preços (base):</strong></p>
                        <p>• Até 5km: R$ 15,00<br>
                           • 5-10km: R$ 20,00<br>
                           • 10-20km: R$ 30,00<br>
                           • Acima de 20km: R$ 30,00 + R$ 2,00/km adicional</p>
                        <p style="font-size: 0.9em; color: #666;">* Valores para pacotes padrão. Itens especiais podem ter acréscimos.</p>
                    `
            },
            carro: {
                title: "Entregas com Carro",
                img: "img/entregaDeCarro.jpeg",
                description: `
                        <p>Solução completa para transportar volumes maiores, móveis, equipamentos e cargas que necessitam de proteção contra interpéries.</p>
                        <p><strong>Características técnicas:</strong></p>
                        <p>• Capacidade: Cargas até 300kg e 2m³<br>
                           • Veículo: Saveiro equipada<br>
                           • Ajudante: Disponível por R$ 30,00 adicional<br>
                           • Exemplos: Móveis pequenos, eletrodomésticos, compras de mercado, mudanças, transporte de peças de veículos, transporte de motocicletas e patinetes</p>
                    `,
                benefits: [
                    "Proteção total contra chuva e sol",
                    "Motoristas experientes em manuseio de carga",
                    "Possibilidade de agendamento",
                    "Seguro opcional para mercadorias valiosas",
                    "Serviço de carga/descarga disponível"
                ],
                pricing: `
                        <p><strong>Tabela de preços (base):</strong></p>
                        <p>• Até 10km: R$ 40,00<br>
                           • 10-20km: R$ 60,00<br>
                           • 20-30km: R$ 80,00<br>
                           • Acima de 30km: R$ 80,00 + R$ 3,50/km adicioinal</p>
                        <p style="font-size: 0.9em; color: #666;">* Taxa de espera: R$ 20,00/hora após 15 minutos gratuitos<p/>
                    `
            },
            express: {
                title: "Entrega Express",
                img: "img/entregaExpressa.jpeg",
                description: `
                        <p>Serviço prioritário com compromisso de horário para quando você não pode esperar. Seu pedido tem prioridade absoluta em nossa operação.</p>
                        <p><strong>Características técnicas:</strong></p>
                        <p>• Tempo garantido: Chegada em até 60 minutos*</p>
                           • Disponibilidade: Seg-Sex: 9h-18h Sab: 10h-16h (Em caso de feriado ou fora de horário, valor pode sofrer alteração)<br>
                           • Monitoramento: Atualização a cada 15 minutos<br>
                           • Exemplos: Documentos, urgentes, peças essenciais, encomendas comerciais</p>
                    `,
                benefits: [
                    "Prioridade máxima no despacho",
                    "Garantia de horário ou 20% de desconto",
                    "Atendimento dedicado por WhatsApp",
                    "Embalagem especial gratuita (para documentos)",
                    "Relatório completo de entrega"
                ],
                pricing: `
                        <p><strong>Tabela de preços:</strong></p>
                        <p>• Motoboy Express: Preço normal + 30%<br>
                           • Carro Express: Preço normal + 40%<br>
                           • Taxa de prioridade: R$ 15,00 fixos</p>
                        <p style="font-size: 0.9em; color: #666;">* Preço normal = valor da tabela regular do serviço</p>
                    `
            }
        };

        document.querySelectorAll('.saiba-mais-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const serviceType = btn.getAttribute('data-service');
                const detailsDiv = document.getElementById(`${serviceType}-details`);
                const isCurrentlyOpen = detailsDiv.style.display === 'block';

                // Fecha todos os detalhes e reseta todos os botões
                document.querySelectorAll('.service-details').forEach(detail => {
                    detail.style.display = 'none';
                });
                document.querySelectorAll('.saiba-mais-btn').forEach(button => {
                    button.textContent = 'Saiba Mais';
                });

                // Se o item clicado não estava aberto, abre ele
                if (!isCurrentlyOpen) {
                    detailsDiv.style.display = 'block';
                    btn.textContent = 'Mostrar Menos';
                    detailsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        });

        // Configurar os botões de orçamento dentro dos detalhes
        document.querySelectorAll('.service-details .btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const serviceType = btn.closest('.service-details').id.replace('-details', '');
                document.getElementById('quote-servico').value = serviceType;
                document.getElementById('quote-modal').classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });

        // Formulários - Com verificações
        const formContato = document.getElementById('form-contato');
        const quoteForm = document.getElementById('quote-form');

        if (formContato) {
            formContato.addEventListener('submit', function (e) {
                e.preventDefault();

                const formData = {
                    nome: this.name.value,
                    email: this.email.value,
                    telefone: this.telefone.value,
                    mensagem: this.mensagem.value
                };

                enviarEmail(formData, 'Nova mensagem do site');

                enviarWhatsApp(formData, 'Nova mensagem');

                showToast('Mensagem enviada com sucesso! Entraremos em contato em breve.');
                this.reset();
            });
        }

        if (quoteForm) {
            quoteForm.addEventListener('submit', function (e) {
                e.preventDefault();

                const formData = {
                    nome: this['quote-nome'].value,
                    email: this['quote-email'].value,
                    telefone: this['quote-telefone'].value,
                    servico: this['quote-servico'].value,
                    descricao: this['quote-descricao'].value
                };

                enviarEmail(formData, 'Nova solicitação de orçamento');

                enviarWhatsApp(formData, 'Orçamento');

                showToast('Solicitação de orçamento enviada! Retornaremos em breve com os detalhes.');
                this.reset();
                closeModalFunc();
            });

        }

        async function enviarEmail(formData, assunto) {
            try {
                const response = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ formData, assunto })
                });

                if (!response.ok) {
                    throw new Error('Failed to send email');
                }
                console.log("E-mail enviado com sucesso!");

                await enviarWhatsAppNotification(formData, assunto);

            } catch (error) {
                console.log("Falha ao enviar e-mail.", error);
            }
        }

        async function enviarWhatsAppNotification(formData, assunto) {
            console.log('Sending WhatsApp notification...');
        }

        window.enviarWhatsApp = function (formData, tipo) {
            const numeroWhatsApp = "5547999123260";
            const mensagem = `Nova solicitação de ${tipo}:\n\n` +
                `Nome: ${formData.nome}\n` +
                `Telefone: ${formData.telefone}\n` +
                `Email: ${formData.email}\n` +
                `${formData.servico ? `Serviço: ${formData.servico}\n` : ''}` +
                `Mensagem: ${formData.mensagem || formData.descricao}`;

            const mensagemCodificada = encodeURIComponent(mensagem);
            window.open(`https://wa.me/${numeroWhatsApp}?text=${mensagemCodificada}`, '_blank');
        }


        const telefoneInput = document.getElementById('quote-telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', function (e) {
                var x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
                e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
            });
        }

        // Animações ao scroll
        const animateElements = document.querySelectorAll('.fade-in');
        if (animateElements.length > 0) {
            function checkScroll() {
                animateElements.forEach(element => {
                    const elementPosition = element.getBoundingClientRect().top;
                    const screenPosition = window.innerHeight / 1.3;

                    if (elementPosition < screenPosition) {
                        element.style.opacity = '1';
                        element.style.transform = 'translateY(0)';
                    }
                });
            }

            window.addEventListener('scroll', checkScroll);
            window.addEventListener('load', checkScroll);
        }
    });

    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        toast.innerHTML = `
                <i class="fas ${icon}"></i>
                <span>${message}</span>
                <span class="toast-close">&times;</span>
            `;

        container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);

        const getConnectionSpeed = () => {
            if (!navigator.connection) return 'unknown';

            const connection = navigator.connection;
            if (connection.effectiveType) {
                return connection.effectiveType;
            }
            return connection.downlink > 5 ? 'fast' : 'slow';
        };

        const getAutoCloseTime = () => {
            const speed = getConnectionSpeed();
            switch (speed) {
                case 'slow-2g':
                case '2g':
                    return 8000;
                case '3g':
                    return 6000;
                case '4g':
                case 'fast':
                    return 4000;
                default:
                    return 5000;
            }
        };

        const autoCloseTime = getAutoCloseTime();
        const autoClose = setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, autoCloseTime);

        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(autoClose);
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        })
    };
});
const chatButton = document.getElementById('chatButton');
if (chatButton) {
    chatButton.addEventListener('click', function() {
        const modal = document.getElementById('chatModal');
        if (modal) {
            modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
        }
    });
}