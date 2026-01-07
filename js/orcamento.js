// Sistema de orçamento - ATUALIZADO COM MULTIPLOS LOCAIS DE COLETA
document.addEventListener('DOMContentLoaded', function() {
    // Tabela de preços baseada nas imagens
    const TABELA_PRECOS = {
        'balneario-camboriu': { min: 15, max: 30, descricao: 'Balneário Camboriú' },
        'camboriu': { min: 20, max: 40, descricao: 'Camboriú' },
        'itapema': { min: 25, max: 50, descricao: 'Itapema' },
        'porto-belo': { min: 35, max: 60, descricao: 'Porto Belo' },
        'bombinhas': { min: 40, max: 70, descricao: 'Bombinhas' },
        'tijucas': { min: 30, max: 55, descricao: 'Tijucas' },
        'brusque': { min: 45, max: 80, descricao: 'Brusque' },
        'gaspar': { min: 40, max: 75, descricao: 'Gaspar' },
        'ilhota': { min: 35, max: 65, descricao: 'Ilhota' },
        'blumenau': { min: 60, max: 120, descricao: 'Blumenau' },
        'navegantes': { min: 40, max: 70, descricao: 'Navegantes' },
        'itajai': { min: 35, max: 65, descricao: 'Itajaí' },
        'penha': { min: 45, max: 80, descricao: 'Penha' },
        'balneario-picarras': { min: 50, max: 90, descricao: 'Balneário Piçarras' },
        'sao-joao-batista': { min: 55, max: 100, descricao: 'São João Batista' },
        'barra-velha': { min: 50, max: 95, descricao: 'Barra Velha' },
        'guabiruba': { min: 40, max: 75, descricao: 'Guabiruba' },
        'bombas': { min: 45, max: 85, descricao: 'Bombas' },
        'florianopolis': { min: 120, max: 200, descricao: 'Florianópolis' },
        'joinville': { min: 150, max: 250, descricao: 'Joinville' }
    };

    // Variáveis globais
    let orcamentoAtual = null;

    // Event Listeners
    document.querySelectorAll('.open-orcamento, #quote-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            abrirModalOrcamento();
        });
    });

    document.querySelectorAll('.close-modal, .close-comprovante').forEach(btn => {
        btn.addEventListener('click', fecharModal);
    });

    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            fecharModal();
        }
    });

    document.getElementById('btn-calcular').addEventListener('click', calcularOrcamento);
    document.getElementById('btn-confirmar').addEventListener('click', gerarComprovante);
    
    document.getElementById('btn-imprimir').addEventListener('click', function() {
        imprimirComprovante();
    });

    document.getElementById('btn-whatsapp').addEventListener('click', confirmarWhatsApp);

    // Configurar locais de coleta
    function configurarLocaisColeta() {
        const locaisColeta = [
            { 
                id: 'balneario-camboriu', 
                nome: 'Balneário Camboriú',
                enderecoBase: 'Balneário Camboriú/SC'
            },
            { 
                id: 'itajai', 
                nome: 'Itajaí',
                enderecoBase: 'Itajaí/SC'
            },
            { 
                id: 'camboriu', 
                nome: 'Camboriú',
                enderecoBase: 'Camboriú/SC'
            }
        ];

        const selectColeta = document.getElementById('local-coleta');
        if (!selectColeta) return;

        // Limpar opções existentes
        selectColeta.innerHTML = '<option value="" disabled selected>Selecione o local de coleta</option>';
        
        // Adicionar opções
        locaisColeta.forEach(local => {
            const option = document.createElement('option');
            option.value = local.id;
            option.textContent = local.nome;
            selectColeta.appendChild(option);
        });

        // Event listener para mostrar campo de endereço detalhado
        selectColeta.addEventListener('change', function() {
            const localSelecionado = locaisColeta.find(local => local.id === this.value);
            const enderecoDetalhadoContainer = document.getElementById('endereco-detalhado-container');
            const enderecoInput = document.getElementById('endereco-detalhado');
            
            if (localSelecionado && enderecoDetalhadoContainer && enderecoInput) {
                enderecoDetalhadoContainer.style.display = 'block';
                enderecoInput.placeholder = `Digite o endereço completo em ${localSelecionado.nome}`;
                enderecoInput.value = '';
                enderecoInput.focus();
            } else if (enderecoDetalhadoContainer) {
                enderecoDetalhadoContainer.style.display = 'none';
            }
        });
    }

    // Atualizar select de cidades de destino
    function atualizarSelectCidades() {
        const select = document.getElementById('cidade-destino');
        if (!select) return;
        
        // Manter apenas a primeira opção
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Adicionar cidades na ordem correta
        const cidadesOrdenadas = [
            'balneario-camboriu', 'camboriu', 'itapema', 'porto-belo', 'bombinhas',
            'tijucas', 'itajai', 'navegantes', 'brusque', 'gaspar', 'ilhota',
            'guabiruba', 'blumenau', 'penha', 'balneario-picarras', 'bombas',
            'barra-velha', 'sao-joao-batista', 'florianopolis', 'joinville'
        ];
        
        cidadesOrdenadas.forEach(cidadeId => {
            const cidadeInfo = TABELA_PRECOS[cidadeId];
            if (cidadeInfo) {
                const option = document.createElement('option');
                option.value = cidadeId;
                option.textContent = cidadeInfo.descricao;
                select.appendChild(option);
            }
        });
    }

    // Aplicar máscara de telefone
    function aplicarMascaraTelefone() {
        const telefoneInput = document.getElementById('cliente-telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                
                if (value.length > 11) {
                    value = value.substring(0, 11);
                }
                
                if (value.length <= 10) {
                    value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
                } else {
                    value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                }
                
                e.target.value = value;
            });
        }
    }

    // Inicializar
    configurarLocaisColeta();
    atualizarSelectCidades();
    aplicarMascaraTelefone();

    // Funções principais
    function abrirModalOrcamento() {
        document.getElementById('orcamento-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Resetar campos
        document.getElementById('orcamento-resultado').style.display = 'none';
        document.getElementById('btn-confirmar').style.display = 'none';
        document.getElementById('endereco-detalhado-container').style.display = 'none';
        
        // Limpar campos
        ['comprimento', 'largura', 'altura', 'peso', 'descricao'].forEach(id => {
            const campo = document.getElementById(id);
            if (campo) campo.value = '';
        });
    }

    function fecharModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }

    function calcularOrcamento() {
        if (!validarFormulario()) {
            mostrarToast('Preencha todos os campos obrigatórios!', 'error');
            return;
        }
        
        // Coletar dados
        const localColetaId = document.getElementById('local-coleta').value;
        const localColetaNome = document.getElementById('local-coleta').options[document.getElementById('local-coleta').selectedIndex].text;
        const enderecoDetalhado = document.getElementById('endereco-detalhado').value;
        const cidadeDestinoId = document.getElementById('cidade-destino').value;
        const cidadeDestinoNome = document.getElementById('cidade-destino').options[document.getElementById('cidade-destino').selectedIndex].text;
        
        const comprimento = parseFloat(document.getElementById('comprimento').value);
        const largura = parseFloat(document.getElementById('largura').value);
        const altura = parseFloat(document.getElementById('altura').value);
        const peso = parseFloat(document.getElementById('peso').value);
        
        // Validações
        if (comprimento > 200 || largura > 200 || altura > 200) {
            mostrarToast('As dimensões não podem ultrapassar 200cm!', 'error');
            return;
        }
        
        if (peso > 50) {
            mostrarToast('O peso não pode ultrapassar 50kg!', 'error');
            return;
        }
        
        // Calcular volume
        const volumeCm3 = comprimento * largura * altura;
        const volumeLitros = volumeCm3 / 1000;
        
        // Obter valor base
        const cidadeInfo = TABELA_PRECOS[cidadeDestinoId];
        if (!cidadeInfo) {
            mostrarToast('Cidade não encontrada na tabela de preços!', 'error');
            return;
        }
        
        let valorBase = cidadeInfo.min;
        
        // Adicional por tamanho
        let adicionalTamanho = 0;
        if (volumeCm3 > 30000) {
            adicionalTamanho = Math.floor(volumeCm3 / 30000) * 10;
        }
        
        // Adicional por peso
        let adicionalPeso = 0;
        if (peso > 5) {
            adicionalPeso = Math.floor((peso - 5)) * 5;
        }
        
        // Calcular total
        const total = valorBase + adicionalTamanho + adicionalPeso;
        const totalFinal = Math.min(total, cidadeInfo.max);
        
        // Salvar orçamento atual
        orcamentoAtual = {
            nome: document.getElementById('cliente-nome').value,
            telefone: document.getElementById('cliente-telefone').value,
            localColeta: localColetaNome,
            enderecoColeta: enderecoDetalhado,
            cidadeDestino: cidadeDestinoNome,
            enderecoEntrega: document.getElementById('entrega-endereco').value,
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
        
        document.getElementById('orcamento-resultado').scrollIntoView({ behavior: 'smooth' });
        mostrarToast('Orçamento calculado com sucesso!', 'success');
    }

    function validarFormulario() {
        const campos = [
            'cliente-nome',
            'cliente-telefone',
            'local-coleta',
            'endereco-detalhado',
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
        
        // Validação de telefone
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
        document.getElementById('comprovante-coleta').textContent = `${orcamentoAtual.localColeta} - ${orcamentoAtual.enderecoColeta}`;
        document.getElementById('comprovante-cidade').textContent = orcamentoAtual.cidadeDestino;
        document.getElementById('comprovante-entrega').textContent = orcamentoAtual.enderecoEntrega;
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

    function imprimirComprovante() {
        const conteudoOriginal = document.body.innerHTML;
        const conteudoComprovante = document.getElementById('comprovante-modal').innerHTML;
        
        // Criar uma nova janela para impressão
        const janelaImpressao = window.open('', '_blank');
        
        // HTML otimizado para impressão
        janelaImpressao.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Comprovante N&G EXPRESS</title>
                <meta charset="UTF-8">
                <style>
                    @media print {
                        @page {
                            size: A4;
                            margin: 15mm;
                        }
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                        }
                        .no-print {
                            display: none !important;
                        }
                        .comprovante-content {
                            max-width: 100%;
                            margin: 0;
                            padding: 0;
                            box-shadow: none;
                            border: none;
                        }
                        .info-section {
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }
                        h2, h3, h4 {
                            page-break-after: avoid;
                        }
                        .comprovante-header {
                            text-align: center;
                            padding: 20px 0;
                            border-bottom: 2px solid #007bff;
                            margin-bottom: 20px;
                        }
                        .comprovante-numero {
                            background: #007bff;
                            color: white;
                            padding: 5px 15px;
                            border-radius: 20px;
                            font-weight: bold;
                            margin: 10px 0;
                            display: inline-block;
                        }
                        .info-section {
                            padding: 15px;
                            margin-bottom: 15px;
                            border-left: 3px solid #ddd;
                            page-break-inside: avoid;
                        }
                        .valor-total {
                            font-size: 1.4em;
                            text-align: center;
                            margin: 20px 0;
                            color: #007bff;
                            font-weight: bold;
                            page-break-before: avoid;
                        }
                        .instrucoes {
                            page-break-before: always;
                        }
                    }
                </style>
            </head>
            <body>
                ${conteudoComprovante}
            </body>
            </html>
        `);
        
        janelaImpressao.document.close();
        
        // Aguardar o carregamento e imprimir
        janelaImpressao.onload = function() {
            janelaImpressao.focus();
            janelaImpressao.print();
            janelaImpressao.onafterprint = function() {
                janelaImpressao.close();
            };
        };
    }

    function confirmarWhatsApp() {
        if (!orcamentoAtual) return;
        
        // Formatar mensagem para WhatsApp com emojis
        const mensagem = `🚚 *NOVO PEDIDO - N&G EXPRESS* 🚚%0A%0A` +
                        `👤 *SOLICITANTE:* ${orcamentoAtual.nome}%0A` +
                        `📱 *TELEFONE:* ${orcamentoAtual.telefone}%0A%0A` +
                        `📍 *COLETA:*%0A${orcamentoAtual.localColeta}%0A${orcamentoAtual.enderecoColeta}%0A%0A` +
                        `🎯 *ENTREGA:*%0A${orcamentoAtual.cidadeDestino}%0A${orcamentoAtual.enderecoEntrega}%0A%0A` +
                        `📦 *ENCOMENDA:*%0A` +
                        `📏 Dimensões: ${orcamentoAtual.dimensoes}%0A` +
                        `⚖️ Peso: ${orcamentoAtual.peso}kg%0A` +
                        `📝 Descrição: ${orcamentoAtual.descricao}%0A%0A` +
                        `💰 *VALOR TOTAL:* ${formatarMoeda(orcamentoAtual.valores.total)}%0A%0A` +
                        `📋 *DETALHES DO PEDIDO:*%0A` +
                        `🔢 Número: ${orcamentoAtual.numeroPedido}%0A` +
                        `📅 Data/Hora: ${orcamentoAtual.data}%0A%0A` +
                        `_Este pedido foi gerado automaticamente pelo site da N&G EXPRESS_`;
        
        // Número da N&G EXPRESS
        const telefoneWhatsApp = '5547999123260';
        
        // Redirecionar para WhatsApp
        window.open(`https://wa.me/${telefoneWhatsApp}?text=${mensagem}`, '_blank');
        
        // Fechar modal
        fecharModal();
        
        mostrarToast('Redirecionando para WhatsApp...', 'success');
    }

    // Função para mostrar toast (deve estar no escopo global)
    window.mostrarToast = function(mensagem, tipo = 'success') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${tipo}`;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="bi ${tipo === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}"></i>
                <span>${mensagem}</span>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Remover após 5 segundos
        setTimeout(() => {
            toast.remove();
        }, 5000);
    };
});