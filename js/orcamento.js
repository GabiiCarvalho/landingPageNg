
document.addEventListener('DOMContentLoaded', function() {
    // Tabela de preços baseada nas imagens (saindo de BALNEÁRIO CAMBORIÚ)
    const TABELA_PRECOS = {
        'balneario-camboriu': { 
            min: 15, 
            max: 30,
            descricao: 'Balneário Camboriú (mesma cidade)'
        },
        'camboriu': { 
            min: 20, 
            max: 40,
            descricao: 'Camboriú (cidade vizinha)'
        },
        'itapema': { 
            min: 25, 
            max: 50,
            descricao: 'Itapema'
        },
        'porto-belo': { 
            min: 35, 
            max: 60,
            descricao: 'Porto Belo'
        },
        'bombinhas': { 
            min: 40, 
            max: 70,
            descricao: 'Bombinhas'
        },
        'tijucas': { 
            min: 30, 
            max: 55,
            descricao: 'Tijucas'
        },
        'brusque': { 
            min: 45, 
            max: 80,
            descricao: 'Brusque'
        },
        'gaspar': { 
            min: 40, 
            max: 75,
            descricao: 'Gaspar'
        },
        'ilhota': { 
            min: 35, 
            max: 65,
            descricao: 'Ilhota'
        },
        'blumenau': { 
            min: 60, 
            max: 120,
            descricao: 'Blumenau'
        },
        'navegantes': { 
            min: 40, 
            max: 70,
            descricao: 'Navegantes'
        },
        'itajai': { 
            min: 35, 
            max: 65,
            descricao: 'Itajaí'
        },
        'penha': { 
            min: 45, 
            max: 80,
            descricao: 'Penha'
        },
        'balneario-picarras': { 
            min: 50, 
            max: 90,
            descricao: 'Balneário Piçarras'
        },
        'sao-joao-batista': { 
            min: 55, 
            max: 100,
            descricao: 'São João Batista'
        },
        'barra-velha': { 
            min: 50, 
            max: 95,
            descricao: 'Barra Velha'
        },
        'guabiruba': { 
            min: 40, 
            max: 75,
            descricao: 'Guabiruba'
        },
        'bombas': { 
            min: 45, 
            max: 85,
            descricao: 'Bombas'
        },
        'florianopolis': { 
            min: 120, 
            max: 200,
            descricao: 'Florianópolis (capital)'
        },
        'joinville': { 
            min: 150, 
            max: 250,
            descricao: 'Joinville'
        }
    };

    // Variáveis globais
    let orcamentoAtual = null;

    // Event Listeners
    // Abrir modal de orçamento
    document.querySelectorAll('.open-orcamento, #quote-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            abrirModalOrcamento();
        });
    });

    // Fechar modais
    document.querySelectorAll('.close-modal, .close-comprovante').forEach(btn => {
        btn.addEventListener('click', fecharModal);
    });

    // Fechar modal ao clicar fora
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            fecharModal();
        }
    });

    // Calcular orçamento
    document.getElementById('btn-calcular').addEventListener('click', calcularOrcamento);

    // Confirmar orçamento
    document.getElementById('btn-confirmar').addEventListener('click', gerarComprovante);

    // Imprimir comprovante
    document.getElementById('btn-imprimir').addEventListener('click', function() {
        window.print();
    });

    // Confirmar no WhatsApp
    document.getElementById('btn-whatsapp').addEventListener('click', confirmarWhatsApp);

    // Atualizar o endereço de coleta automaticamente
    function atualizarEnderecoColeta() {
        const coletaInput = document.getElementById('coleta-endereco');
        if (coletaInput) {
            coletaInput.value = 'Balneário Camboriú/SC';
            coletaInput.setAttribute('readonly', 'readonly');
        }
    }

    // Atualizar as opções do select de cidades
    function atualizarSelectCidades() {
        const select = document.getElementById('cidade-destino');
        if (!select) return;
        
        // Limpar opções existentes (exceto a primeira)
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Adicionar cidades na nova ordem (mais próximas primeiro)
        const cidadesOrdenadas = [
            { value: 'balneario-camboriu', text: 'Balneário Camboriú' },
            { value: 'camboriu', text: 'Camboriú' },
            { value: 'itapema', text: 'Itapema' },
            { value: 'porto-belo', text: 'Porto Belo' },
            { value: 'bombinhas', text: 'Bombinhas' },
            { value: 'tijucas', text: 'Tijucas' },
            { value: 'itajai', text: 'Itajaí' },
            { value: 'navegantes', text: 'Navegantes' },
            { value: 'brusque', text: 'Brusque' },
            { value: 'gaspar', text: 'Gaspar' },
            { value: 'ilhota', text: 'Ilhota' },
            { value: 'guabiruba', text: 'Guabiruba' },
            { value: 'blumenau', text: 'Blumenau' },
            { value: 'penha', text: 'Penha' },
            { value: 'balneario-picarras', text: 'Balneário Piçarras' },
            { value: 'bombas', text: 'Bombas' },
            { value: 'barra-velha', text: 'Barra Velha' },
            { value: 'sao-joao-batista', text: 'São João Batista' },
            { value: 'florianopolis', text: 'Florianópolis' },
            { value: 'joinville', text: 'Joinville' }
        ];
        
        cidadesOrdenadas.forEach(cidade => {
            const option = document.createElement('option');
            option.value = cidade.value;
            option.textContent = cidade.text;
            select.appendChild(option);
        });
    }

    // Inicializar configurações
    atualizarEnderecoColeta();
    atualizarSelectCidades();

    // Funções
    function abrirModalOrcamento() {
        document.getElementById('orcamento-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        // Resetar formulário
        document.getElementById('orcamento-resultado').style.display = 'none';
        document.getElementById('btn-confirmar').style.display = 'none';
        
        // Resetar valores dos campos
        document.getElementById('comprimento').value = '';
        document.getElementById('largura').value = '';
        document.getElementById('altura').value = '';
        document.getElementById('peso').value = '';
        document.getElementById('descricao').value = '';
    }

    function fecharModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }

    function calcularOrcamento() {
        // Validar formulário
        if (!validarFormulario()) {
            mostrarToast('Preencha todos os campos obrigatórios!', 'error');
            return;
        }
        
        // Coletar dados
        const cidade = document.getElementById('cidade-destino').value;
        const comprimento = parseFloat(document.getElementById('comprimento').value);
        const largura = parseFloat(document.getElementById('largura').value);
        const altura = parseFloat(document.getElementById('altura').value);
        const peso = parseFloat(document.getElementById('peso').value);
        const cidadeNome = document.getElementById('cidade-destino').options[document.getElementById('cidade-destino').selectedIndex].text;
        
        // Validações adicionais
        if (comprimento > 200 || largura > 200 || altura > 200) {
            mostrarToast('As dimensões não podem ultrapassar 200cm!', 'error');
            return;
        }
        
        if (peso > 50) {
            mostrarToast('O peso não pode ultrapassar 50kg!', 'error');
            return;
        }
        
        // Calcular volume em cm³
        const volumeCm3 = comprimento * largura * altura;
        const volumeLitros = volumeCm3 / 1000;
        
        // Obter valor base da cidade
        const cidadeInfo = TABELA_PRECOS[cidade];
        if (!cidadeInfo) {
            mostrarToast('Cidade não encontrada na tabela de preços!', 'error');
            return;
        }
        
        let valorBase = cidadeInfo.min;
        
        // Adicional por tamanho (volume)
        let adicionalTamanho = 0;
        if (volumeCm3 > 30000) { // Acima de 30x30x30cm = 27,000cm³
            adicionalTamanho = Math.floor(volumeCm3 / 30000) * 10; // R$10 a cada 30x30x30cm adicional
        }
        
        // Adicional por peso
        let adicionalPeso = 0;
        if (peso > 5) { // Acima de 5kg
            adicionalPeso = Math.floor((peso - 5)) * 5; // R$5 a cada kg adicional
        }
        
        // Calcular total
        const total = valorBase + adicionalTamanho + adicionalPeso;
        
        // Limitar ao valor máximo da cidade
        const totalFinal = Math.min(total, cidadeInfo.max);
        
        // Salvar orçamento atual
        orcamentoAtual = {
            nome: document.getElementById('cliente-nome').value,
            telefone: document.getElementById('cliente-telefone').value,
            coleta: document.getElementById('coleta-endereco').value,
            cidade: cidadeNome,
            cidadeId: cidade,
            entrega: document.getElementById('entrega-endereco').value,
            dimensoes: `${comprimento}x${largura}x${altura}cm`,
            volume: volumeLitros.toFixed(1),
            peso: peso.toFixed(1),
            descricao: document.getElementById('descricao').value || 'Não informada',
            valores: {
                base: valorBase,
                tamanho: adicionalTamanho,
                peso: adicionalPeso,
                total: totalFinal
            },
            data: new Date().toLocaleString('pt-BR')
        };
        
        // Mostrar resultado
        document.getElementById('base-valor').textContent = formatarMoeda(valorBase);
        document.getElementById('tamanho-valor').textContent = formatarMoeda(adicionalTamanho);
        document.getElementById('peso-valor').textContent = formatarMoeda(adicionalPeso);
        document.getElementById('total-valor').textContent = formatarMoeda(totalFinal);
        
        document.getElementById('orcamento-resultado').style.display = 'block';
        document.getElementById('btn-confirmar').style.display = 'block';
        
        // Rolar para o resultado
        document.getElementById('orcamento-resultado').scrollIntoView({ behavior: 'smooth' });
        
        mostrarToast('Orçamento calculado com sucesso!', 'success');
    }

    function validarFormulario() {
        const campos = [
            'cliente-nome',
            'cliente-telefone', 
            'coleta-endereco',
            'cidade-destino',
            'entrega-endereco',
            'comprimento',
            'largura',
            'altura',
            'peso'
        ];
        
        for (const campoId of campos) {
            const campo = document.getElementById(campoId);
            if (!campo || !campo.value.trim()) {
                if (campo) {
                    campo.style.borderColor = '#f44336';
                    campo.focus();
                }
                return false;
            } else if (campo) {
                campo.style.borderColor = '';
            }
        }
        
        // Validação específica para telefone
        const telefone = document.getElementById('cliente-telefone').value;
        const telefoneDigits = telefone.replace(/\D/g, '');
        if (telefoneDigits.length < 10) {
            mostrarToast('Telefone deve ter pelo menos 10 dígitos!', 'error');
            document.getElementById('cliente-telefone').style.borderColor = '#f44336';
            document.getElementById('cliente-telefone').focus();
            return false;
        }
        
        return true;
    }

    function formatarMoeda(valor) {
        return `R$ ${valor.toFixed(2).replace('.', ',')}`;
    }

    function gerarComprovante() {
        if (!orcamentoAtual) {
            mostrarToast('Calcule o orçamento primeiro!', 'error');
            return;
        }
        
        // Gerar número de pedido
        const numeroPedido = 'NG' + Date.now().toString().slice(-6);
        
        // Preencher comprovante
        document.getElementById('pedido-numero').textContent = numeroPedido;
        document.getElementById('pedido-data').textContent = orcamentoAtual.data;
        document.getElementById('comprovante-nome').textContent = orcamentoAtual.nome;
        document.getElementById('comprovante-telefone').textContent = orcamentoAtual.telefone;
        document.getElementById('comprovante-coleta').textContent = orcamentoAtual.coleta;
        document.getElementById('comprovante-cidade').textContent = orcamentoAtual.cidade;
        document.getElementById('comprovante-entrega').textContent = orcamentoAtual.entrega;
        document.getElementById('comprovante-dimensoes').textContent = orcamentoAtual.dimensoes;
        document.getElementById('comprovante-peso').textContent = `${orcamentoAtual.peso}kg`;
        document.getElementById('comprovante-descricao').textContent = orcamentoAtual.descricao;
        document.getElementById('comprovante-valor').textContent = formatarMoeda(orcamentoAtual.valores.total);
        
        // Adicionar número ao objeto
        orcamentoAtual.numeroPedido = numeroPedido;
        
        // Fechar modal de orçamento e abrir comprovante
        fecharModal();
        document.getElementById('comprovante-modal').style.display = 'block';
        
        mostrarToast('Comprovante gerado! Imprima e confirme no WhatsApp.', 'success');
    }

    function confirmarWhatsApp() {
        if (!orcamentoAtual) return;
        
        // Formatar mensagem para WhatsApp
        const mensagem = `*PEDIDO CONFIRMADO - N&G EXPRESS*%0A%0A` +
                        `*Pedido:* ${orcamentoAtual.numeroPedido}%0A` +
                        `*Cliente:* ${orcamentoAtual.nome}%0A` +
                        `*Telefone:* ${orcamentoAtual.telefone}%0A` +
                        `*Coleta (Balneário Camboriú):* ${orcamentoAtual.coleta}%0A` +
                        `*Entrega (${orcamentoAtual.cidade}):* ${orcamentoAtual.entrega}%0A` +
                        `*Encomenda:* ${orcamentoAtual.dimensoes} - ${orcamentoAtual.peso}kg%0A` +
                        `*Descrição:* ${orcamentoAtual.descricao}%0A` +
                        `*Valor Total:* ${formatarMoeda(orcamentoAtual.valores.total)}%0A%0A` +
                        `*Data/Hora:* ${orcamentoAtual.data}%0A` +
                        `_Este pedido foi gerado automaticamente pelo site_`;
        
        // Número da N&G EXPRESS
        const telefoneWhatsApp = '5547999123260';
        
        // Redirecionar para WhatsApp
        window.open(`https://wa.me/${telefoneWhatsApp}?text=${mensagem}`, '_blank');
        
        // Fechar modal
        fecharModal();
        
        mostrarToast('Redirecionando para WhatsApp...', 'success');
    }

    // Adicionar máscara para telefone
    function aplicarMascaraTelefone() {
        const telefoneInput = document.getElementById('cliente-telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                
                if (value.length > 11) {
                    value = value.substring(0, 11);
                }
                
                if (value.length <= 10) {
                    // Formato: (XX) XXXXX-XXXX
                    value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
                } else {
                    // Formato: (XX) XXXXXX-XXXX
                    value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                }
                
                e.target.value = value;
            });
        }
    }

    // Inicializar máscara de telefone
    aplicarMascaraTelefone();
});