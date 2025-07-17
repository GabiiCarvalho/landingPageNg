document.addEventListener('DOMContentLoaded', function () {

    // Inicialização do Swiper com 4 slides
    const heroSwiper = new Swiper('.hero-swiper', {
        // Configurações
        loop: true,
        autoplay: {
            delay: 2000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
        },
        effect: 'fade',
        fadeEffect: {
            crossFade: true
        },
        speed: 1000,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
            dynamicBullets: true
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        // Disparar animações quando o slide muda
        on: {
            init: function () {
                this.slides[this.activeIndex].querySelectorAll('.fade-in').forEach(el => {
                    el.style.opacity = 1;
                });
            },
            slideChangeTransitionStart: function () {
                const nextSlide = this.slides[this.activeIndex];
                nextSlide.querySelectorAll('.fade-in').forEach(el => {
                    el.style.opacity = 0;
                    el.style.animation = 'none';
                    void el.offsetWidth;
                    el.style.animation = null;
                });
            }
        }
    });

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

    // Scroll suave para os serviços
    document.querySelectorAll('.footer-links a[href^="#servico-"]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop = 100,
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

    function validarFormularioContato(formData) {
        const erros = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneDigits = formData.phone.replace(/\D/g, '');

        // Validação de campos obrigatórios
        if (!formData.name?.trim()) erros.push('Nome é obrigatório');
        if (!formData.email?.trim()) erros.push('E-mail é obrigatório');
        if (!formData.phone?.trim()) erros.push('Telefone é obrigatório');
        if (!formData.message?.trim()) erros.push('Mensagem é obrigatória');

        // Validação de formato de e-mail
        if (formData.email && !emailRegex.test(formData.email)) {
            erros.push('Formato de e-mail inválido');
        }

        // Validação de telefone (mínimo 10 dígitos)
        if (phoneDigits.length < 10) {
            erros.push('Telefone deve ter pelo menos 10 dígitos');
        }

        return erros;
    }

    function validarFormularioOrcamento(formData) {
        const erros = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneDigits = formData.phone.replace(/\D/g, '');

        // Validação de campos obrigatórios
        if (!formData.name?.trim()) erros.push('Nome é obrigatório');
        if (!formData.email?.trim()) erros.push('E-mail é obrigatório');
        if (!formData.phone?.trim()) erros.push('Telefone é obrigatório');
        if (!formData.service?.trim()) erros.push('Serviço é obrigatório');
        if (!formData.description?.trim()) erros.push('Descrição é obrigatória');

        // Validação de formato de e-mail
        if (formData.email && !emailRegex.test(formData.email)) {
            erros.push('Formato de e-mail inválido');
        }

        // Validação de telefone (mínimo 10 dígitos)
        if (phoneDigits.length < 10) {
            erros.push('Telefone deve ter pelo menos 10 dígitos');
        }

        return erros;
    }

    const formContato = document.getElementById('form-contato');

    if (formContato) {
        formContato.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Coletar dados do formulário
            const formData = {
                name: this.name.value.trim(),
                email: this.email.value.trim(),
                phone: this.telefone.value,
                message: this.mensagem.value.trim()
            };

            // Validar antes de enviar
            const erros = validarFormularioContato(formData);

            if (erros.length > 0) {
                showToast(erros.join('<br>'), 'error');
                return;
            }

            // Mostrar loading no botão
            const submitBtn = this.querySelector('button[type="submit"]');
            const btnOriginalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

            const errosContato = validarFormularioContato(formData);
            if (errosContato.length > 0) {
                showToast(errosContato.join('<br>'), 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = btnOriginalText;
                return;
            }

            try {
                // Enviar para o backend
                const response = await enviarParaBackend(formData, 'contact');

                // Feedback de sucesso
                showToast(response.message || 'Mensagem enviada com sucesso!');

                // Resetar formulário
                this.reset();
            } catch (error) {
                // Feedback de erro
                showToast(error.message || 'Erro ao enviar mensagem. Tente novamente.', 'error');
            } finally {
                // Restaurar botão
                submitBtn.disabled = false;
                submitBtn.innerHTML = btnOriginalText;
            }
        });
    }

    const quoteForm = document.getElementById('quote-form');

    async function enviarParaBackend(formData, endpoint) {
        try {
            const response = await fetch(`http://localhost:5500/api/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao enviar dados');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro:', error);
            throw error;
        }
    }

    if (quoteForm) {
        quoteForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const formData = {
                name: this['quote-nome'].value,
                email: this['quote-email'].value,
                phone: this['quote-telefone'].value,
                service: this['quote-servico'].value,
                description: this['quote-descricao'].value
            };

            const errosOrcamento = validarFormularioOrcamento(formData);
            if (errosOrcamento.length > 0) {
                showToast(errosOrcamento.join('<br>'), 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = btnOriginalText;
                return;
            }

            try {
                const response = await enviarParaBackend(formData, 'quote');
                showToast(response.message || 'Solicitação de orçamento enviada! Retornaremos em breve com os detalhes.');
                this.reset();
                closeModalFunc();
            } catch (error) {
                showToast(error.message || 'Erro ao enviar solicitação. Tente novamente.', 'error');
            }
        });
    }


    function enviarWhatsApp(formData, tipo) {
        const numeroWhatsApp = "5547996412384";
        const mensagem = `Nova solicitação de ${tipo}:\n\n` +
            `Nome: ${formData.nome}\n` +
            `Telefone: ${formData.teleone}\n` +
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

    // Fechar automaticamente após 5 segundos (ou mais para mensagens longas)
    const delay = message.length > 100 ? 8000 : 5000;
    const autoClose = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, delay);

    // Fechar ao clicar no X
    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(autoClose);
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    });
}