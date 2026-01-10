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

    // Adicionar CSS para o comprovante
    function adicionarEstiloComprovante() {
        const style = document.createElement('style');
        style.textContent = `
            .comprovante-content {
                width: 100%;
                max-width: 500px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                padding: 25px;
                font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            }
            
            .comprovante-header {
                text-align: center;
                margin-bottom: 25px;
                padding-bottom: 15px;
                border-bottom: 3px solid #007bff;
            }
            
            .comprovante-header h2 {
                color: #007bff;
                margin: 0 0 10px 0;
                font-size: 24px;
                font-weight: 700;
            }
            
            .comprovante-section {
                margin-bottom: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 10px;
                border-left: 4px solid #007bff;
            }
            
            .comprovante-section h3 {
                color: #007bff;
                margin: 0 0 10px 0;
                font-size: 16px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .comprovante-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                padding-bottom: 8px;
                border-bottom: 1px dashed #dee2e6;
            }
            
            .comprovante-item:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }
            
            .comprovante-label {
                font-weight: 500;
                color: #495057;
            }
            
            .comprovante-value {
                font-weight: 600;
                color: #212529;
                text-align: right;
                max-width: 60%;
                word-break: break-word;
            }
            
            .valor-total-section {
                background: #e8f4ff;
                border-left: 4px solid #28a745;
                padding: 20px;
                text-align: center;
                margin: 25px 0;
            }
            
            .valor-total {
                font-size: 28px;
                font-weight: 800;
                color: #28a745;
                margin: 10px 0;
            }
            
            .comprovante-footer {
                text-align: center;
                margin-top: 25px;
                padding-top: 15px;
                border-top: 2px dashed #007bff;
                color: #6c757d;
                font-size: 14px;
            }
            
            .comprovante-buttons {
                display: flex;
                gap: 15px;
                margin-top: 25px;
            }
            
            .comprovante-buttons button {
                flex: 1;
                padding: 15px;
                font-size: 16px;
                font-weight: 600;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                transition: all 0.3s ease;
            }
            
            .comprovante-buttons button:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            #btn-imprimir {
                background: linear-gradient(135deg, #007bff, #0056b3);
                color: white;
                border: none;
            }
            
            #btn-whatsapp {
                background: linear-gradient(135deg, #25D366, #128C7E);
                color: white;
                border: none;
            }
            
            /* Para impressão */
            @media print {
                .no-print, .comprovante-buttons, .close-comprovante {
                    display: none !important;
                }
                
                .comprovante-content {
                    box-shadow: none;
                    padding: 0;
                    max-width: 100%;
                }
                
                .valor-total {
                    font-size: 24px;
                }
            }
            
            /* Mobile */
            @media (max-width: 768px) {
                .comprovante-content {
                    padding: 15px;
                    margin: 10px;
                }
                
                .comprovante-section {
                    padding: 12px;
                }
                
                .comprovante-buttons {
                    flex-direction: column;
                }
                
                .comprovante-item {
                    flex-direction: column;
                }
                
                .comprovante-value {
                    text-align: left;
                    max-width: 100%;
                    margin-top: 5px;
                }
                
                .valor-total {
                    font-size: 24px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Chamar a função para adicionar estilos
    adicionarEstiloComprovante();

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
            enderecoColeta: enderecoColeta,
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
        orcamentoAtual.numeroPedido = numeroPedido;

        // Atualizar o comprovante com os dados e emojis
        const comprovanteContent = document.getElementById('comprovante-content');
        if (comprovanteContent) {
            comprovanteContent.innerHTML = `
                <div class="comprovante-header">
                    <h2>🚚 N&G EXPRESS 🚚</h2>
                    <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                        <span><strong>🔢 Pedido:</strong> ${numeroPedido}</span>
                        <span><strong>📅 Data:</strong> ${orcamentoAtual.data}</span>
                    </div>
                </div>

                <div class="comprovante-section">
                    <h3>👤 CLIENTE</h3>
                    <div class="comprovante-item">
                        <span class="comprovante-label">Nome:</span>
                        <span class="comprovante-value">${orcamentoAtual.nome}</span>
                    </div>
                    <div class="comprovante-item">
                        <span class="comprovante-label">Telefone:</span>
                        <span class="comprovante-value">${orcamentoAtual.telefone}</span>
                    </div>
                </div>

                <div class="comprovante-section">
                    <h3>📍 COLETA</h3>
                    <div class="comprovante-item">
                        <span class="comprovante-label">Local:</span>
                        <span class="comprovante-value">${orcamentoAtual.localColeta}</span>
                    </div>
                    <div class="comprovante-item">
                        <span class="comprovante-label">Endereço:</span>
                        <span class="comprovante-value">${orcamentoAtual.enderecoColeta}</span>
                    </div>
                </div>

                <div class="comprovante-section">
                    <h3>🎯 ENTREGA</h3>
                    <div class="comprovante-item">
                        <span class="comprovante-label">Cidade:</span>
                        <span class="comprovante-value">${orcamentoAtual.cidadeDestino}</span>
                    </div>
                    <div class="comprovante-item">
                        <span class="comprovante-label">Endereço:</span>
                        <span class="comprovante-value">${orcamentoAtual.enderecoEntrega}</span>
                    </div>
                </div>

                <div class="comprovante-section">
                    <h3>📦 ENCOMENDA</h3>
                    <div class="comprovante-item">
                        <span class="comprovante-label">📏 Dimensões:</span>
                        <span class="comprovante-value">${orcamentoAtual.dimensoes}</span>
                    </div>
                    <div class="comprovante-item">
                        <span class="comprovante-label">📦 Volume:</span>
                        <span class="comprovante-value">${orcamentoAtual.volume}L</span>
                    </div>
                    <div class="comprovante-item">
                        <span class="comprovante-label">⚖️ Peso:</span>
                        <span class="comprovante-value">${orcamentoAtual.peso}kg</span>
                    </div>
                    <div class="comprovante-item">
                        <span class="comprovante-label">📝 Descrição:</span>
                        <span class="comprovante-value">${orcamentoAtual.descricao}</span>
                    </div>
                </div>

                <div class="valor-total-section">
                    <h3>💰 VALOR TOTAL</h3>
                    <div class="valor-total">${formatarMoeda(orcamentoAtual.valores.total)}</div>
                    <div style="font-size: 14px; color: #6c757d; margin-top: 10px;">
                        <div>Base: ${formatarMoeda(orcamentoAtual.valores.base)}</div>
                        ${orcamentoAtual.valores.tamanho > 0 ? `<div>Adicional tamanho: ${formatarMoeda(orcamentoAtual.valores.tamanho)}</div>` : ''}
                        ${orcamentoAtual.valores.peso > 0 ? `<div>Adicional peso: ${formatarMoeda(orcamentoAtual.valores.peso)}</div>` : ''}
                    </div>
                </div>

                <div class="comprovante-footer">
                    <p>✅ OBRIGADO PELA PREFERÊNCIA!</p>
                    <p>📞 Aguarde nosso contato para confirmação da coleta</p>
                </div>
            `;
        }

        // Fechar modal de orçamento e abrir comprovante
        fecharModal();
        document.getElementById('comprovante-modal').style.display = 'block';

        mostrarToast('Comprovante gerado! Imprima e confirme no WhatsApp.', 'success');
    }

    function imprimirComprovante() {
        if (!orcamentoAtual) {
            mostrarToast('Gere o comprovante primeiro!', 'error');
            return;
        }

        // Conteúdo do recibo para impressão (sem botões)
        const receiptContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Recibo N&G EXPRESS - ${orcamentoAtual.numeroPedido}</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    @media print {
                        @page {
                            size: A4;
                            margin: 20mm;
                        }
                        body {
                            font-family: 'Segoe UI', system-ui, sans-serif;
                            font-size: 14px;
                            line-height: 1.5;
                            color: #333;
                            max-width: 100mm;
                            margin: 0 auto;
                            padding: 15px;
                            background: white;
                        }
                    }
                    @media screen {
                        body {
                            font-family: 'Segoe UI', system-ui, sans-serif;
                            font-size: 16px;
                            line-height: 1.6;
                            color: #333;
                            max-width: 100mm;
                            margin: 20px auto;
                            padding: 20px;
                            background: #f5f5f5;
                        }
                        .recibo-content {
                            background: white;
                            border-radius: 10px;
                            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                            padding: 25px;
                        }
                        .print-button {
                            display: block;
                            width: 100%;
                            margin: 20px 0;
                            padding: 15px;
                            background: #007bff;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                        }
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 25px;
                        padding-bottom: 15px;
                        border-bottom: 3px solid #007bff;
                    }
                    
                    .header h1 {
                        color: #007bff;
                        margin: 0 0 10px 0;
                        font-size: 24px;
                    }
                    
                    .info-line {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 8px;
                        font-size: 14px;
                    }
                    
                    .section {
                        margin: 20px 0;
                        padding: 15px;
                        background: #f8f9fa;
                        border-radius: 8px;
                        border-left: 4px solid #007bff;
                    }
                    
                    .section-title {
                        color: #007bff;
                        margin: 0 0 15px 0;
                        font-size: 16px;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    
                    .item {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 10px;
                        padding-bottom: 10px;
                        border-bottom: 1px dashed #ddd;
                    }
                    
                    .item:last-child {
                        border-bottom: none;
                    }
                    
                    .total {
                        background: #e8f4ff;
                        border-left: 4px solid #28a745;
                        padding: 20px;
                        text-align: center;
                        margin: 30px 0;
                    }
                    
                    .total-value {
                        font-size: 28px;
                        font-weight: 800;
                        color: #28a745;
                        margin: 10px 0;
                    }
                    
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 15px;
                        border-top: 2px dashed #007bff;
                        color: #666;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="recibo-content">
                    <div class="header">
                        <h1>🚚 N&G EXPRESS 🚚</h1>
                        <div class="info-line">
                            <span><strong>🔢 Pedido:</strong> ${orcamentoAtual.numeroPedido}</span>
                            <span><strong>📅 Data:</strong> ${orcamentoAtual.data}</span>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">👤 CLIENTE</div>
                        <div class="item">
                            <span><strong>Nome:</strong></span>
                            <span>${orcamentoAtual.nome}</span>
                        </div>
                        <div class="item">
                            <span><strong>Telefone:</strong></span>
                            <span>${orcamentoAtual.telefone}</span>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">📍 COLETA</div>
                        <div class="item">
                            <span><strong>Local:</strong></span>
                            <span>${orcamentoAtual.localColeta}</span>
                        </div>
                        <div class="item">
                            <span><strong>Endereço:</strong></span>
                            <span>${orcamentoAtual.enderecoColeta}</span>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">🎯 ENTREGA</div>
                        <div class="item">
                            <span><strong>Cidade:</strong></span>
                            <span>${orcamentoAtual.cidadeDestino}</span>
                        </div>
                        <div class="item">
                            <span><strong>Endereço:</strong></span>
                            <span>${orcamentoAtual.enderecoEntrega}</span>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">📦 ENCOMENDA</div>
                        <div class="item">
                            <span><strong>Dimensões:</strong></span>
                            <span>${orcamentoAtual.dimensoes}</span>
                        </div>
                        <div class="item">
                            <span><strong>Volume:</strong></span>
                            <span>${orcamentoAtual.volume}L</span>
                        </div>
                        <div class="item">
                            <span><strong>Peso:</strong></span>
                            <span>${orcamentoAtual.peso}kg</span>
                        </div>
                        <div class="item">
                            <span><strong>Descrição:</strong></span>
                            <span>${orcamentoAtual.descricao}</span>
                        </div>
                    </div>

                    <div class="total">
                        <div class="section-title">💰 VALOR TOTAL</div>
                        <div class="total-value">${formatarMoeda(orcamentoAtual.valores.total)}</div>
                        <div style="font-size: 14px; margin-top: 10px;">
                            <div>Base: ${formatarMoeda(orcamentoAtual.valores.base)}</div>
                            ${orcamentoAtual.valores.tamanho > 0 ? `<div>Adicional tamanho: ${formatarMoeda(orcamentoAtual.valores.tamanho)}</div>` : ''}
                            ${orcamentoAtual.valores.peso > 0 ? `<div>Adicional peso: ${formatarMoeda(orcamentoAtual.valores.peso)}</div>` : ''}
                        </div>
                    </div>

                    <div class="footer">
                        <p>✅ OBRIGADO PELA PREFERÊNCIA!</p>
                        <p>📞 Aguarde nosso contato para confirmação da coleta</p>
                    </div>
                </div>

                <button class="print-button" onclick="window.print()">🖨️ Imprimir Recibo</button>
                <button class="print-button" onclick="window.close()" style="background: #6c757d;">✖️ Fechar</button>

                <script>
                    // Imprimir automaticamente em dispositivos móveis
                    if (window.innerWidth <= 768) {
                        setTimeout(() => {
                            window.print();
                        }, 1000);
                    }
                </script>
            </body>
            </html>
        `;

        // Abrir nova janela para impressão
        const printWindow = window.open('', '_blank');
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        
        // Focar na nova janela
        setTimeout(() => {
            printWindow.focus();
        }, 500);
    }

    function confirmarWhatsApp() {
        if (!orcamentoAtual) {
            mostrarToast('Gere o comprovante primeiro!', 'error');
            return;
        }

        // Mensagem simplificada para WhatsApp (automática)
        const mensagem = `*🚚 NOVO PEDIDO - N&G EXPRESS*%0A%0A` +
            `*👤 CLIENTE*%0A${orcamentoAtual.nome}%0A${orcamentoAtual.telefone}%0A%0A` +
            `*📍 COLETA*%0A${orcamentoAtual.localColeta}%0A${orcamentoAtual.enderecoColeta}%0A%0A` +
            `*🎯 ENTREGA*%0A${orcamentoAtual.cidadeDestino}%0A${orcamentoAtual.enderecoEntrega}%0A%0A` +
            `*📦 ENCOMENDA*%0A` +
            `Dimensões: ${orcamentoAtual.dimensoes}%0A` +
            `Peso: ${orcamentoAtual.peso}kg%0A` +
            `Descrição: ${orcamentoAtual.descricao}%0A%0A` +
            `*💰 VALOR TOTAL: ${formatarMoeda(orcamentoAtual.valores.total).replace('R$ ', 'R$')}*%0A%0A` +
            `🔢 Pedido: ${orcamentoAtual.numeroPedido}%0A` +
            `📅 ${orcamentoAtual.data}%0A%0A` +
            `_Confirme este pedido para iniciar a coleta._`;

        // Número da N&G EXPRESS
        const telefoneWhatsApp = '5547999123260';
        
        // Abrir WhatsApp com a mensagem pré-preenchida
        const whatsappUrl = `https://wa.me/${telefoneWhatsApp}?text=${encodeURIComponent(mensagem)}`;
        
        // Tentar abrir em nova aba
        window.open(whatsappUrl, '_blank');
        
        // Mostrar mensagem de sucesso
        mostrarToast('Abrindo WhatsApp para confirmação...', 'success');
        
        // Fechar modal após 1 segundo
        setTimeout(() => {
            fecharModal();
        }, 1000);
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