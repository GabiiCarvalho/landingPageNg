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
        imprimirRecibo();
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
                border-radius: 10px;
                padding: 20px;
                font-family: 'Courier New', monospace;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            
            .comprovante-header {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px dashed #000;
            }
            
            .comprovante-header h2 {
                color: #007bff;
                margin: 0 0 5px 0;
                font-size: 22px;
                font-weight: bold;
            }
            
            .comprovante-section {
                margin-bottom: 15px;
                padding: 10px 0;
                border-bottom: 1px solid #eee;
            }
            
            .comprovante-section h3 {
                color: #333;
                margin: 0 0 8px 0;
                font-size: 16px;
                font-weight: bold;
            }
            
            .comprovante-item {
                margin-bottom: 5px;
                display: flex;
                justify-content: space-between;
            }
            
            .comprovante-label {
                font-weight: 500;
                color: #666;
            }
            
            .comprovante-value {
                font-weight: 600;
                color: #000;
                text-align: right;
                max-width: 60%;
                word-break: break-word;
            }
            
            .valor-total-section {
                text-align: center;
                margin: 20px 0;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
                border: 2px solid #28a745;
            }
            
            .valor-total {
                font-size: 24px;
                font-weight: bold;
                color: #28a745;
                margin: 10px 0;
            }
            
            .comprovante-footer {
                text-align: center;
                margin-top: 20px;
                padding-top: 15px;
                border-top: 2px dashed #000;
                color: #666;
                font-size: 13px;
            }
            
            .comprovante-buttons {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }
            
            .comprovante-buttons button {
                flex: 1;
                padding: 12px;
                font-size: 14px;
                font-weight: 600;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            #btn-imprimir {
                background: #007bff;
                color: white;
                border: none;
            }
            
            #btn-whatsapp {
                background: #25D366;
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
                    font-size: 22px;
                }
            }
            
            /* Mobile */
            @media (max-width: 768px) {
                .comprovante-content {
                    padding: 15px;
                    margin: 10px;
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
                    margin-top: 3px;
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

        // Atualizar o comprovante com os dados
        const comprovanteContent = document.getElementById('comprovante-content');
        if (comprovanteContent) {
            comprovanteContent.innerHTML = `
                <div class="comprovante-header">
                    <h2>🚚 N&G EXPRESS 🚚</h2>
                    <div style="font-size: 14px; margin-top: 5px;">
                        <strong>Pedido:</strong> ${numeroPedido} | 
                        <strong>Data:</strong> ${orcamentoAtual.data}
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
                        <span class="comprovante-label">Dimensões:</span>
                        <span class="comprovante-value">${orcamentoAtual.dimensoes}</span>
                    </div>
                    <div class="comprovante-item">
                        <span class="comprovante-label">Peso:</span>
                        <span class="comprovante-value">${orcamentoAtual.peso}kg</span>
                    </div>
                    <div class="comprovante-item">
                        <span class="comprovante-label">Descrição:</span>
                        <span class="comprovante-value">${orcamentoAtual.descricao}</span>
                    </div>
                </div>

                <div class="valor-total-section">
                    <h3>💰 VALOR TOTAL</h3>
                    <div class="valor-total">${formatarMoeda(orcamentoAtual.valores.total)}</div>
                    <div style="font-size: 13px; margin-top: 5px;">
                        <div>Base: ${formatarMoeda(orcamentoAtual.valores.base)}</div>
                        ${orcamentoAtual.valores.tamanho > 0 ? `<div>Adicional tamanho: ${formatarMoeda(orcamentoAtual.valores.tamanho)}</div>` : ''}
                        ${orcamentoAtual.valores.peso > 0 ? `<div>Adicional peso: ${formatarMoeda(orcamentoAtual.valores.peso)}</div>` : ''}
                    </div>
                </div>

                <div class="comprovante-footer">
                    <p>Obrigado pela preferência!</p>
                    <p>Aguarde nosso contato para confirmação da coleta</p>
                </div>
            `;
        }

        // Fechar modal de orçamento e abrir comprovante
        fecharModal();
        document.getElementById('comprovante-modal').style.display = 'block';

        mostrarToast('Comprovante gerado! Imprima e confirme no WhatsApp.', 'success');
    }

    function imprimirRecibo() {
        if (!orcamentoAtual) {
            mostrarToast('Gere o comprovante primeiro!', 'error');
            return;
        }

        // Gerar conteúdo do recibo no formato tradicional
        const reciboContent = `
===========================================
            🚚 N&G EXPRESS 🚚
        TRANSPORTE E ENTREGAS RÁPIDAS
===========================================

🔢 PEDIDO: ${orcamentoAtual.numeroPedido}
📅 DATA: ${orcamentoAtual.data}
-------------------------------------------

👤 **CLIENTE**
-------------------------------------------
Nome: ${orcamentoAtual.nome}
Telefone: ${orcamentoAtual.telefone}

📍 **COLETA**
-------------------------------------------
Local: ${orcamentoAtual.localColeta}
Endereço: ${orcamentoAtual.enderecoColeta}

🎯 **ENTREGA**
-------------------------------------------
Cidade: ${orcamentoAtual.cidadeDestino}
Endereço: ${orcamentoAtual.enderecoEntrega}

📦 **ENCOMENDA**
-------------------------------------------
Dimensões: ${orcamentoAtual.dimensoes}
Volume: ${orcamentoAtual.volume}L
Peso: ${orcamentoAtual.peso}kg
Descrição: ${orcamentoAtual.descricao}

💰 **VALORES**
-------------------------------------------
Base: ${formatarMoeda(orcamentoAtual.valores.base)}
${orcamentoAtual.valores.tamanho > 0 ? `Adicional tamanho: ${formatarMoeda(orcamentoAtual.valores.tamanho)}` : ''}
${orcamentoAtual.valores.peso > 0 ? `Adicional peso: ${formatarMoeda(orcamentoAtual.valores.peso)}` : ''}
-------------------------------------------

💵 **TOTAL A PAGAR**
         ${formatarMoeda(orcamentoAtual.valores.total)}
-------------------------------------------

📋 **OBSERVAÇÕES**
-------------------------------------------
• Este é um orçamento/autorização de coleta
• Valor sujeito a confirmação após análise
• Aguarde contato para agendamento
• Pagamento na entrega

===========================================
         ✅ RECIBO AUTORIZADO ✅
===========================================

📞 CONTATO: (47) 99912-3260
📧 E-MAIL: contato@ngexpress.com.br
🌐 SITE: www.ngexpress.com.br

===========================================
          OBRIGADO PELA PREFERÊNCIA!
===========================================
        `;

        // Criar nova janela para impressão
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        
        // HTML otimizado para impressão de recibo
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Recibo N&G EXPRESS - ${orcamentoAtual.numeroPedido}</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    @media print {
                        @page {
                            size: A4 portrait;
                            margin: 15mm;
                        }
                        body {
                            font-family: 'Courier New', monospace;
                            font-size: 14px;
                            line-height: 1.4;
                            color: #000;
                            background: white;
                            margin: 0;
                            padding: 0;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                    
                    @media screen {
                        body {
                            font-family: 'Courier New', monospace;
                            font-size: 16px;
                            line-height: 1.5;
                            color: #000;
                            background: #f5f5f5;
                            padding: 20px;
                            margin: 0;
                        }
                        .recibo-container {
                            background: white;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 30px;
                            box-shadow: 0 0 20px rgba(0,0,0,0.1);
                            border-radius: 5px;
                            white-space: pre-wrap;
                            word-wrap: break-word;
                        }
                        .print-buttons {
                            text-align: center;
                            margin-top: 30px;
                        }
                        .print-btn {
                            padding: 12px 24px;
                            margin: 0 10px;
                            background: #007bff;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            font-size: 16px;
                            cursor: pointer;
                            display: inline-flex;
                            align-items: center;
                            gap: 8px;
                        }
                        .print-btn:hover {
                            background: #0056b3;
                        }
                        .close-btn {
                            background: #6c757d;
                        }
                        .close-btn:hover {
                            background: #545b62;
                        }
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                        line-height: 1.2;
                    }
                    
                    .separator {
                        border-top: 2px dashed #000;
                        margin: 15px 0;
                    }
                    
                    .total-box {
                        text-align: center;
                        margin: 25px 0;
                        padding: 15px;
                        border: 3px solid #28a745;
                        background: #f8fff9;
                    }
                    
                    .total-amount {
                        font-size: 28px;
                        font-weight: bold;
                        color: #28a745;
                        margin: 10px 0;
                    }
                    
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 15px;
                        border-top: 1px solid #ccc;
                        font-size: 13px;
                        color: #666;
                    }
                    
                    .contact-info {
                        font-size: 13px;
                        color: #444;
                        text-align: center;
                        margin: 20px 0;
                    }
                    
                    /* Mobile */
                    @media (max-width: 768px) {
                        body {
                            font-size: 14px;
                            padding: 10px;
                        }
                        .recibo-container {
                            padding: 20px;
                        }
                        .total-amount {
                            font-size: 24px;
                        }
                        .print-buttons {
                            display: flex;
                            flex-direction: column;
                            gap: 10px;
                        }
                        .print-btn {
                            width: 100%;
                            margin: 5px 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="recibo-container">
                    <div class="header">
                        <h2 style="margin: 0 0 10px 0; font-size: 24px;">🚚 N&G EXPRESS 🚚</h2>
                        <div style="font-size: 16px; margin-bottom: 5px;">TRANSPORTE E ENTREGAS RÁPIDAS</div>
                        <div style="font-size: 14px; color: #666;">-------------------------------------------</div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <div><strong>🔢 PEDIDO:</strong> ${orcamentoAtual.numeroPedido}</div>
                        <div><strong>📅 DATA/HORA:</strong> ${orcamentoAtual.data}</div>
                    </div>
                    
                    <div class="separator"></div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="font-weight: bold; margin-bottom: 10px;">👤 CLIENTE</div>
                        <div><strong>Nome:</strong> ${orcamentoAtual.nome}</div>
                        <div><strong>Telefone:</strong> ${orcamentoAtual.telefone}</div>
                    </div>
                    
                    <div class="separator"></div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="font-weight: bold; margin-bottom: 10px;">📍 COLETA</div>
                        <div><strong>Local:</strong> ${orcamentoAtual.localColeta}</div>
                        <div><strong>Endereço:</strong> ${orcamentoAtual.enderecoColeta}</div>
                    </div>
                    
                    <div class="separator"></div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="font-weight: bold; margin-bottom: 10px;">🎯 ENTREGA</div>
                        <div><strong>Cidade:</strong> ${orcamentoAtual.cidadeDestino}</div>
                        <div><strong>Endereço:</strong> ${orcamentoAtual.enderecoEntrega}</div>
                    </div>
                    
                    <div class="separator"></div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="font-weight: bold; margin-bottom: 10px;">📦 ENCOMENDA</div>
                        <div><strong>Dimensões:</strong> ${orcamentoAtual.dimensoes}</div>
                        <div><strong>Volume:</strong> ${orcamentoAtual.volume}L</div>
                        <div><strong>Peso:</strong> ${orcamentoAtual.peso}kg</div>
                        <div><strong>Descrição:</strong> ${orcamentoAtual.descricao}</div>
                    </div>
                    
                    <div class="separator"></div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="font-weight: bold; margin-bottom: 10px;">💰 VALORES</div>
                        <div>Base: ${formatarMoeda(orcamentoAtual.valores.base)}</div>
                        ${orcamentoAtual.valores.tamanho > 0 ? `<div>Adicional tamanho: ${formatarMoeda(orcamentoAtual.valores.tamanho)}</div>` : ''}
                        ${orcamentoAtual.valores.peso > 0 ? `<div>Adicional peso: ${formatarMoeda(orcamentoAtual.valores.peso)}</div>` : ''}
                    </div>
                    
                    <div class="total-box">
                        <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">💵 TOTAL A PAGAR</div>
                        <div class="total-amount">${formatarMoeda(orcamentoAtual.valores.total)}</div>
                    </div>
                    
                    <div class="separator"></div>
                    
                    <div style="margin-bottom: 20px; font-size: 13px;">
                        <div style="font-weight: bold; margin-bottom: 10px;">📋 OBSERVAÇÕES</div>
                        <div>• Este é um orçamento/autorização de coleta</div>
                        <div>• Valor sujeito a confirmação após análise</div>
                        <div>• Aguarde contato para agendamento</div>
                        <div>• Pagamento na entrega</div>
                    </div>
                    
                    <div style="text-align: center; margin: 25px 0; padding: 10px; border: 2px solid #000; font-weight: bold; font-size: 16px;">
                        ✅ RECIBO AUTORIZADO ✅
                    </div>
                    
                    <div class="contact-info">
                        <div><strong>📞 CONTATO:</strong> (47) 99912-3260</div>
                        <div><strong>📧 E-MAIL:</strong> contato@ngexpress.com.br</div>
                        <div><strong>🌐 SITE:</strong> www.ngexpress.com.br</div>
                    </div>
                    
                    <div class="footer">
                        <div>===========================================</div>
                        <div style="font-weight: bold; margin: 10px 0;">OBRIGADO PELA PREFERÊNCIA!</div>
                        <div>===========================================</div>
                    </div>
                </div>
                
                <div class="print-buttons no-print">
                    <button class="print-btn" onclick="window.print()">
                        🖨️ Imprimir Recibo
                    </button>
                    <button class="print-btn close-btn" onclick="window.close()">
                        ✖️ Fechar Janela
                    </button>
                </div>
                
                <script>
                    // Auto-print após carregar a página
                    window.onload = function() {
                        // Dar um pequeno delay para garantir que tudo carregou
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
    }

    function confirmarWhatsApp() {
        if (!orcamentoAtual) {
            mostrarToast('Gere o comprovante primeiro!', 'error');
            return;
        }

        // Mensagem simplificada para WhatsApp
        const mensagem = `*NOVO PEDIDO - N&G EXPRESS*` +
            `*Pedido:* ${orcamentoAtual.numeroPedido}` +
            `*Data:* ${orcamentoAtual.data}` +
            `*Cliente:*${orcamentoAtual.nome} ${orcamentoAtual.telefone}` +
            `*Coleta:*${orcamentoAtual.localColeta} ${orcamentoAtual.enderecoColeta}` +
            `*Entrega:*${orcamentoAtual.cidadeDestino} ${orcamentoAtual.enderecoEntrega}` +
            `*Encomenda:*${orcamentoAtual.dimensoes} ${orcamentoAtual.peso}kg ${orcamentoAtual.descricao}` +
            `*Valor Total:* ${formatarMoeda(orcamentoAtual.valores.total)}` +
            `Confirme este pedido para iniciar a coleta.`;

        const telefoneWhatsApp = '5547999123260';
        const whatsappUrl = `https://wa.me/${telefoneWhatsApp}?text=${mensagem}`;
        
        // Abrir WhatsApp em nova aba
        window.open(whatsappUrl, '_blank');
        
        mostrarToast('Abrindo WhatsApp para confirmação...', 'success');
        
        // Fechar modal
        setTimeout(() => {
            fecharModal();
        }, 1000);
    }

    // Função para mostrar toast
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