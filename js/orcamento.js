// Sistema de orçamento - ATUALIZADO COM MULTIPLOS LOCAIS DE COLETA
document.addEventListener('DOMContentLoaded', function () {
    // Tabela de preços baseada nas imagens
    const TABELA_PRECOS = {
        'balneario-camboriu': { min: 15, max: 30, descricao: 'Balneário Camboriú' },
        'camboriu': { min: 20, max: 30, descricao: 'Camboriú' },
        'itapema': { min: 50, max: 50, descricao: 'Itapema' },
        'porto-belo': { min: 70, max: 70, descricao: 'Porto Belo' },
        'bombinhas': { min: 120, max: 120, descricao: 'Bombinhas' },
        'tijucas': { min: 80, max: 80, descricao: 'Tijucas' },
        'brusque': { min: 100, max: 100, descricao: 'Brusque' },
        'gaspar': { min: 100, max: 100, descricao: 'Gaspar' },
        'ilhota': { min: 100, max: 100, descricao: 'Ilhota' },
        'blumenau': { min: 120, max: 120, descricao: 'Blumenau' },
        'navegantes': { min: 60, max: 60, descricao: 'Navegantes' },
        'itajai': { min: 30, max: 50, descricao: 'Itajaí' },
        'penha': { min: 80, max: 80, descricao: 'Penha' },
        'balneario-picarras': { min: 100, max: 100, descricao: 'Balneário Piçarras' },
        'sao-joao-batista': { min: 120, max: 120, descricao: 'São João Batista' },
        'barra-velha': { min: 120, max: 120, descricao: 'Barra Velha' },
        'guabiruba': { min: 120, max: 120, descricao: 'Guabiruba' },
        'bombas': { min: 120, max: 120, descricao: 'Bombas' },
        'florianopolis': { min: 150, max: 200, descricao: 'Florianópolis' },
        'joinville': { min: 150, max: 200, descricao: 'Joinville' }
    };

    // Variáveis globais
    let orcamentoAtual = null;

    // Event Listeners
    document.querySelectorAll('.open-orcamento, #quote-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            abrirModalOrcamento();
        });
    });

    document.querySelectorAll('.close-modal, .close-comprovante').forEach(btn => {
        btn.addEventListener('click', fecharModal);
    });

    window.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal')) {
            fecharModal();
        }
    });

    document.getElementById('btn-calcular').addEventListener('click', calcularOrcamento);
    document.getElementById('btn-confirmar').addEventListener('click', gerarComprovante);

    document.getElementById('btn-imprimir').addEventListener('click', function () {
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
        selectColeta.addEventListener('change', function () {
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
            telefoneInput.addEventListener('input', function (e) {
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

        // Coletar dados com verificação
        const localColetaSelect = document.getElementById('local-coleta');
        const enderecoDetalhado = document.getElementById('endereco-detalhado');
        const cidadeDestinoSelect = document.getElementById('cidade-destino');

        if (!localColetaSelect || !enderecoDetalhado || !cidadeDestinoSelect) {
            console.error('Elementos do formulário não encontrados');
            mostrarToast('Erro no formulário!', 'error');
            return;
        }

        const localColetaId = localColetaSelect.value;
        const localColetaNome = localColetaSelect.options[localColetaSelect.selectedIndex].text;
        const enderecoColeta = enderecoDetalhado.value;
        const cidadeDestinoId = cidadeDestinoSelect.value;
        const cidadeDestinoNome = cidadeDestinoSelect.options[cidadeDestinoSelect.selectedIndex].text;

        console.log('Dados coletados:', {
            localColetaId,
            localColetaNome,
            enderecoColeta,
            cidadeDestinoId,
            cidadeDestinoNome
        });

        const comprimento = parseFloat(document.getElementById('comprimento').value) || 0;
        const largura = parseFloat(document.getElementById('largura').value) || 0;
        const altura = parseFloat(document.getElementById('altura').value) || 0;
        const peso = parseFloat(document.getElementById('peso').value) || 0;

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
            data: new Date().toLocaleString('pt-BR'),
            timestamp: Date.now()
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
            <title>Recibo N&G EXPRESS</title>
            <meta charset="UTF-8">
            <style>
                @media print {
                    @page {
                        size: 80mm 297mm;
                        margin: 0;
                        padding: 0;
                    }
                    body {
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        width: 80mm;
                        margin: 0;
                        padding: 5mm;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                    }
                    .no-print {
                        display: none !important;
                    }
                    h1, h2, h3 {
                        text-align: center;
                        margin: 5px 0;
                    }
                    hr {
                        border: none;
                        border-top: 1px dashed #000;
                        margin: 10px 0;
                    }
                }
                @media screen {
                    body {
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        background: #f5f5f5;
                        padding: 20px;
                    }
                    pre {
                        background: white;
                        padding: 20px;
                        border: 1px solid #ddd;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        max-width: 80mm;
                        margin: 0 auto;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                    }
                    .print-button {
                        display: block;
                        margin: 20px auto;
                        padding: 10px 20px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                    }
                    .print-button:hover {
                        background: #0056b3;
                    }
                }
            </style>
        </head>
        <body>
            <pre>${receiptContent}</pre>
            <button class="print-button" onclick="window.print()">Imprimir Recibo</button>
            <button class="print-button" onclick="window.close()" style="background: #6c757d;">Fechar</button>
        </body>
        </html>
    `);

        janelaImpressao.document.close();

        
        setTimeout(() => {
            janelaImpressao.print();
        }, 500);
    }

    function confirmarWhatsApp() {
        if (!orcamentoAtual) return;

        // Mensagem simplificada
        const receiptContent = `
        ========================
              N&G EXPRESS
        ========================

        Cliente: ${orcamentoAtual.nome}
        Telefone: ${orcamentoAtual.telefone}
        Data: ${orcamentoAtual.data}
        Nº Pedido: ${orcamentoAtual.numeroPedido}
        -------------------------
        COLETA:

        ${orcamentoAtual.localColeta}
        ${orcamentoAtual.enderecoColeta}
        -------------------------
        ENTREGA:

        ${orcamentoAtual.cidadeDestino}
        ${orcamentoAtual.enderecoEntrega}    
        -------------------------
        ENCOMENDA:

        Dimensões: ${orcamentoAtual.dimensoes}
        Volume: ${orcamentoAtual.volume}
        Peso: ${orcamentoAtual.peso}Kg
        Descrição: ${orcamentoAtual.descricao}
        -------------------------
        VALORES:

        Base: R$ ${orcamentoAtual.valores.base.toFixed(2)}
        Adicional tamanho: R$ ${orcamentoAtual.valores.tamanho.toFixed(2)}
        Adicional peso: R$ ${orcamentoAtual.valores.peso.toFixed(2)} 
        ------------------------

        TOTAL: R$ ${orcamentoAtual.valores.total.toFixed(2)}

        ==========================

        OBRIGADO PELA PREFERÊNCIA!
        Aguarde nosso contato para
        confirmação da coleta.
        ==========================
        `



        const telefoneWhatsApp = '5547999123260';
        window.open(`https://wa.me/${telefoneWhatsApp}?text=${mensagem}`, '_blank');

        fecharModal();
        mostrarToast('Enviando confirmação para WhatsApp...', 'success');
    }

    // Função para mostrar toast (deve estar no escopo global)
    window.mostrarToast = function (mensagem, tipo = 'success') {
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