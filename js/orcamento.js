// Sistema de orçamento - ATUALIZADO COM MULTIPLOS LOCAIS DE COLETA E BAIRROS ESPECIAIS
document.addEventListener('DOMContentLoaded', function () {
    console.log('Script de orçamento carregado com sucesso!');
    
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

    // Bairros de Itajaí com valor adicional de R$ 20,00 (30 + 20 = 50)
    const BAIRROS_ITAJAI_ADICIONAL = [
        { nome: 'Espinheiros', valor: 20 },
        { nome: 'Itaipava', valor: 20 },
        { nome: 'Santa Regina', valor: 20 },
        { nome: 'Rio do Meio', valor: 20 },
        { nome: 'Brilhante', valor: 20 },
        { nome: 'São Roque', valor: 20 },
        { nome: 'Volta de Cima', valor: 20 },
        { nome: 'Salseiros', valor: 20 },
        { nome: 'Arraial dos Cunhas', valor: 20 }
    ];

    // Bairros de Camboriú com valor adicional de R$ 35,00
    const BAIRROS_CAMBORIU_ADICIONAL = [
        { nome: 'Rio Pequeno', valor: 35 },
        { nome: 'Rodovia dos Macacos', valor: 35 },
        { nome: 'Braço', valor: 35 },
        { nome: 'Caminho da Palha', valor: 35 },
        { nome: 'Avenida Arquipélago Encantado', valor: 35 },
        { nome: 'Caetes', valor: 35 },
        { nome: 'Vila Conceição', valor: 35 }
    ];

    // Bairros normais de Itajaí (sem adicional)
    const BAIRROS_ITAJAI_NORMAIS = [
        'Centro', 'Fazenda', 'Fazendinha', 'Murta', 'Barra do Rio', 
        'Cabeçudas', 'Atalaia', 'São João', 'São Vicente', 'Cordeiros', 
        'Cidade Nova', 'Canhanduba', 'Ressacada', 'Beira Rio', 'Praia Brava'
    ];

    // Bairros normais de Camboriú (sem adicional)
    const BAIRROS_CAMBORIU_NORMAIS = [
        'Centro', 'Lídia Duarte', 'Santa Regina', 'Areias', 'Cedros', 
        'Monte Alegre', 'Tabuleiro', 'São Francisco', 'Barranco', 'Jardim Europa'
    ];

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

    const btnCalcular = document.getElementById('btn-calcular');
    if (btnCalcular) {
        btnCalcular.addEventListener('click', calcularOrcamento);
    }

    const btnConfirmar = document.getElementById('btn-confirmar');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', gerarComprovante);
    }

    const btnImprimir = document.getElementById('btn-imprimir');
    if (btnImprimir) {
        btnImprimir.addEventListener('click', function () {
            imprimirRecibo();
        });
    }

    const btnWhatsapp = document.getElementById('btn-whatsapp');
    if (btnWhatsapp) {
        btnWhatsapp.addEventListener('click', confirmarWhatsApp);
    }

    // Configurar locais de coleta COM SELECTOR DE BAIRROS
    function configurarLocaisColeta() {
        const locaisColeta = [
            {
                id: 'balneario-camboriu',
                nome: 'Balneário Camboriú',
                enderecoBase: 'Balneário Camboriú/SC',
                temBairros: false,
                bairrosEspeciais: false
            },
            {
                id: 'camboriu',
                nome: 'Camboriú',
                enderecoBase: 'Camboriú/SC',
                temBairros: true,
                bairrosEspeciais: true,
                bairrosEspeciaisLista: BAIRROS_CAMBORIU_ADICIONAL,
                bairrosNormais: BAIRROS_CAMBORIU_NORMAIS
            },
            {
                id: 'itajai',
                nome: 'Itajaí',
                enderecoBase: 'Itajaí/SC',
                temBairros: true,
                bairrosEspeciais: true,
                bairrosEspeciaisLista: BAIRROS_ITAJAI_ADICIONAL,
                bairrosNormais: BAIRROS_ITAJAI_NORMAIS
            }
        ];

        const selectColeta = document.getElementById('local-coleta');
        const bairroColetaContainer = document.getElementById('bairro-coleta-container');
        const selectBairroColeta = document.getElementById('bairro-coleta');
        const enderecoDetalhadoContainer = document.getElementById('endereco-detalhado-container');
        const enderecoInput = document.getElementById('endereco-detalhado');

        if (!selectColeta || !bairroColetaContainer || !selectBairroColeta) {
            console.warn('Elementos do formulário de coleta não encontrados');
            return;
        }

        // Limpar opções existentes
        selectColeta.innerHTML = '<option value="" disabled selected>Selecione o local de coleta</option>';

        // Adicionar opções - ORDEM CORRETA
        locaisColeta.forEach(local => {
            const option = document.createElement('option');
            option.value = local.id;
            option.textContent = local.nome;
            selectColeta.appendChild(option);
        });

        // Função para atualizar bairros de coleta
        function atualizarBairrosColeta(cidadeId) {
            const localSelecionado = locaisColeta.find(local => local.id === cidadeId);

            // Limpar bairros existentes
            selectBairroColeta.innerHTML = '<option value="" disabled selected>Selecione o bairro</option>';

            if (localSelecionado && localSelecionado.temBairros) {
                bairroColetaContainer.style.display = 'block';

                // Adicionar opção "Selecione o bairro"
                const optionSelecione = document.createElement('option');
                optionSelecione.value = '';
                optionSelecione.textContent = 'Selecione o bairro';
                optionSelecione.disabled = true;
                optionSelecione.selected = true;
                selectBairroColeta.appendChild(optionSelecione);

                // Separador para bairros normais
                const optionSeparadorNormais = document.createElement('option');
                optionSeparadorNormais.disabled = true;
                optionSeparadorNormais.textContent = '── Bairros Normais ──';
                selectBairroColeta.appendChild(optionSeparadorNormais);

                // Adicionar bairros normais (sem adicional)
                if (localSelecionado.bairrosNormais) {
                    localSelecionado.bairrosNormais.forEach(bairro => {
                        const option = document.createElement('option');
                        option.value = bairro.toLowerCase();
                        option.textContent = bairro;
                        option.dataset.valor = 0;
                        option.dataset.tipo = 'normal';
                        selectBairroColeta.appendChild(option);
                    });
                }

                // Separador para bairros especiais (se houver)
                if (localSelecionado.bairrosEspeciaisLista && localSelecionado.bairrosEspeciaisLista.length > 0) {
                    const optionSeparadorEspeciais = document.createElement('option');
                    optionSeparadorEspeciais.disabled = true;
                    optionSeparadorEspeciais.textContent = '── Bairros Especiais ──';
                    selectBairroColeta.appendChild(optionSeparadorEspeciais);

                    // Adicionar bairros especiais (com adicional)
                    localSelecionado.bairrosEspeciaisLista.forEach(bairro => {
                        const option = document.createElement('option');
                        option.value = bairro.nome.toLowerCase();
                        option.textContent = bairro.nome;
                        option.dataset.valor = bairro.valor;
                        option.dataset.tipo = 'especial';
                        selectBairroColeta.appendChild(option);
                    });
                }

                // Opção "Outro bairro"
                const optionOutro = document.createElement('option');
                optionOutro.value = 'outro';
                optionOutro.textContent = 'Outro bairro';
                optionOutro.dataset.valor = 0;
                optionOutro.dataset.tipo = 'normal';
                selectBairroColeta.appendChild(optionOutro);

            } else {
                bairroColetaContainer.style.display = 'none';
                selectBairroColeta.value = '';
            }
        }

        // Event listener para mostrar campo de endereço detalhado e bairros
        selectColeta.addEventListener('change', function () {
            const localSelecionado = locaisColeta.find(local => local.id === this.value);

            // Atualizar bairros de coleta
            atualizarBairrosColeta(this.value);

            if (localSelecionado && enderecoDetalhadoContainer && enderecoInput) {
                enderecoDetalhadoContainer.style.display = 'block';
                enderecoInput.placeholder = `Digite o endereço completo em ${localSelecionado.nome}`;
                enderecoInput.value = '';
                enderecoInput.focus();
            } else if (enderecoDetalhadoContainer) {
                enderecoDetalhadoContainer.style.display = 'none';
            }
        });

        // Event listener para bairro de coleta
        selectBairroColeta.addEventListener('change', function () {
            if (this.value && this.options[this.selectedIndex].dataset.valor > 0) {
                const bairroNome = this.options[this.selectedIndex].text;
                const adicional = this.options[this.selectedIndex].dataset.valor;
                const tipo = this.options[this.selectedIndex].dataset.tipo;
                
                if (tipo === 'especial') {
                    mostrarToast(`Bairro ${bairroNome} selecionado (adicional: R$ ${adicional},00)`, 'info');
                } else {
                    mostrarToast(`Bairro ${bairroNome} selecionado (sem adicional)`, 'info');
                }
            } else if (this.value) {
                const bairroNome = this.options[this.selectedIndex].text;
                const tipo = this.options[this.selectedIndex].dataset.tipo;
                
                if (tipo === 'normal') {
                    mostrarToast(`Bairro ${bairroNome} selecionado (sem adicional)`, 'info');
                }
            }
        });
    }

    // Atualizar select de cidades de destino COM SELECTOR DE BAIRROS
    function atualizarSelectCidades() {
        const select = document.getElementById('cidade-destino');
        const bairroEntregaContainer = document.getElementById('bairro-entrega-container');
        const selectBairroEntrega = document.getElementById('bairro-entrega');

        if (!select || !bairroEntregaContainer || !selectBairroEntrega) {
            console.warn('Elementos do formulário de destino não encontrados');
            return;
        }

        // Limpar apenas as opções após a primeira
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Adicionar cidades na ordem correta, começando pelas cidades locais
        const cidadesOrdenadas = [
            'balneario-camboriu', 'camboriu', 'itajai',  // CIDADES PRINCIPAIS primeiro
            'itapema', 'porto-belo', 'bombinhas',
            'tijucas', 'navegantes', 'brusque', 'gaspar', 'ilhota',
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

        // Função para atualizar bairros de entrega
        function atualizarBairrosEntrega(cidadeId) {
            // Limpar bairros existentes
            selectBairroEntrega.innerHTML = '<option value="" disabled selected>Selecione o bairro</option>';

            if (cidadeId === 'itajai') {
                bairroEntregaContainer.style.display = 'block';

                // Adicionar opção "Selecione o bairro"
                const optionSelecione = document.createElement('option');
                optionSelecione.value = '';
                optionSelecione.textContent = 'Selecione o bairro';
                optionSelecione.disabled = true;
                optionSelecione.selected = true;
                selectBairroEntrega.appendChild(optionSelecione);

                // Separador para bairros normais
                const optionSeparadorNormais = document.createElement('option');
                optionSeparadorNormais.disabled = true;
                optionSeparadorNormais.textContent = '── Bairros Normais ──';
                selectBairroEntrega.appendChild(optionSeparadorNormais);

                // Adicionar bairros normais de Itajaí
                BAIRROS_ITAJAI_NORMAIS.forEach(bairro => {
                    const option = document.createElement('option');
                    option.value = bairro.toLowerCase();
                    option.textContent = bairro;
                    option.dataset.valor = 0;
                    option.dataset.tipo = 'normal';
                    selectBairroEntrega.appendChild(option);
                });

                // Separador para bairros especiais
                const optionSeparadorEspeciais = document.createElement('option');
                optionSeparadorEspeciais.disabled = true;
                optionSeparadorEspeciais.textContent = '── Bairros Especiais ──';
                selectBairroEntrega.appendChild(optionSeparadorEspeciais);

                // Adicionar bairros especiais de Itajaí
                BAIRROS_ITAJAI_ADICIONAL.forEach(bairro => {
                    const option = document.createElement('option');
                    option.value = bairro.nome.toLowerCase();
                    option.textContent = bairro.nome;
                    option.dataset.valor = bairro.valor;
                    option.dataset.tipo = 'especial';
                    selectBairroEntrega.appendChild(option);
                });

                // Opção "Outro bairro"
                const optionOutro = document.createElement('option');
                optionOutro.value = 'outro';
                optionOutro.textContent = 'Outro bairro';
                optionOutro.dataset.valor = 0;
                optionOutro.dataset.tipo = 'normal';
                selectBairroEntrega.appendChild(optionOutro);

            } else if (cidadeId === 'camboriu') {
                bairroEntregaContainer.style.display = 'block';

                // Adicionar opção "Selecione o bairro"
                const optionSelecione = document.createElement('option');
                optionSelecione.value = '';
                optionSelecione.textContent = 'Selecione o bairro';
                optionSelecione.disabled = true;
                optionSelecione.selected = true;
                selectBairroEntrega.appendChild(optionSelecione);

                // Separador para bairros normais
                const optionSeparadorNormais = document.createElement('option');
                optionSeparadorNormais.disabled = true;
                optionSeparadorNormais.textContent = '── Bairros Normais ──';
                selectBairroEntrega.appendChild(optionSeparadorNormais);

                // Adicionar bairros normais de Camboriú
                BAIRROS_CAMBORIU_NORMAIS.forEach(bairro => {
                    const option = document.createElement('option');
                    option.value = bairro.toLowerCase();
                    option.textContent = bairro;
                    option.dataset.valor = 0;
                    option.dataset.tipo = 'normal';
                    selectBairroEntrega.appendChild(option);
                });

                // Separador para bairros especiais
                const optionSeparadorEspeciais = document.createElement('option');
                optionSeparadorEspeciais.disabled = true;
                optionSeparadorEspeciais.textContent = '── Bairros Especiais ──';
                selectBairroEntrega.appendChild(optionSeparadorEspeciais);

                // Adicionar bairros especiais de Camboriú
                BAIRROS_CAMBORIU_ADICIONAL.forEach(bairro => {
                    const option = document.createElement('option');
                    option.value = bairro.nome.toLowerCase();
                    option.textContent = bairro.nome;
                    option.dataset.valor = bairro.valor;
                    option.dataset.tipo = 'especial';
                    selectBairroEntrega.appendChild(option);
                });

                // Opção "Outro bairro"
                const optionOutro = document.createElement('option');
                optionOutro.value = 'outro';
                optionOutro.textContent = 'Outro bairro';
                optionOutro.dataset.valor = 0;
                optionOutro.dataset.tipo = 'normal';
                selectBairroEntrega.appendChild(optionOutro);

            } else {
                bairroEntregaContainer.style.display = 'none';
                selectBairroEntrega.value = '';
            }
        }

        // Event listener para cidade de destino
        select.addEventListener('change', function () {
            atualizarBairrosEntrega(this.value);
        });

        // Event listener para bairro de entrega
        selectBairroEntrega.addEventListener('change', function () {
            if (this.value && this.options[this.selectedIndex].dataset.valor > 0) {
                const bairroNome = this.options[this.selectedIndex].text;
                const adicional = this.options[this.selectedIndex].dataset.valor;
                const tipo = this.options[this.selectedIndex].dataset.tipo;
                
                if (tipo === 'especial') {
                    mostrarToast(`Bairro ${bairroNome} selecionado (adicional: R$ ${adicional},00)`, 'info');
                }
            } else if (this.value) {
                const bairroNome = this.options[this.selectedIndex].text;
                const tipo = this.options[this.selectedIndex].dataset.tipo;
                
                if (tipo === 'normal') {
                    mostrarToast(`Bairro ${bairroNome} selecionado (sem adicional)`, 'info');
                }
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

    // Função para verificar se o bairro é especial
    function verificarBairroEspecial(bairroNome, cidadeId) {
        if (!bairroNome) return false;
        
        const bairroLower = bairroNome.toLowerCase().trim();
        
        if (cidadeId === 'itajai') {
            return BAIRROS_ITAJAI_ADICIONAL.some(bairro => 
                bairro.nome.toLowerCase() === bairroLower
            );
        } else if (cidadeId === 'camboriu') {
            return BAIRROS_CAMBORIU_ADICIONAL.some(bairro => 
                bairro.nome.toLowerCase() === bairroLower
            );
        }
        
        return false;
    }

    // Função para obter valor do bairro selecionado
    function obterValorBairroSelecionado(bairroSelectId, cidadeId) {
        const select = document.getElementById(bairroSelectId);
        if (!select || !select.value) return {
            valorAdicional: 0,
            tipoBairro: 'normal',
            nomeBairro: ''
        };

        const selectedOption = select.options[select.selectedIndex];
        const valorAdicional = parseInt(selectedOption.dataset.valor) || 0;
        const tipoBairro = selectedOption.dataset.tipo || 'normal';
        
        return {
            valorAdicional: valorAdicional,
            tipoBairro: tipoBairro,
            nomeBairro: selectedOption.text
        };
    }

    // Função para calcular valor base baseado na cidade
    function calcularValorBase(cidadeId, localColetaId, bairroColetaInfo, bairroEntregaInfo) {
        let valorBase = TABELA_PRECOS[cidadeId].min;
        let adicionalBairro = 0;
        let isBairroEspecial = false;
        let tipoBairroEspecial = '';

        // LÓGICA: Itajaí e Camboriú têm bairros especiais
        if (cidadeId === 'itajai' && bairroEntregaInfo.tipoBairro === 'especial') {
            // Entrega em bairro especial de Itajaí
            adicionalBairro = bairroEntregaInfo.valorAdicional; // R$ 20,00
            isBairroEspecial = true;
            tipoBairroEspecial = 'itajai';
            valorBase = 30; // Valor base para Itajaí
        }
        else if (cidadeId === 'camboriu') {
            // Para Camboriú, o valor base depende da cidade de coleta
            if (localColetaId === 'balneario-camboriu') {
                valorBase = 20; // Coleta em Balneário Camboriú
            } else if (localColetaId === 'camboriu') {
                valorBase = 15; // Coleta em Camboriú
            } else if (localColetaId === 'itajai') {
                valorBase = 30; // Coleta em Itajaí
            }
            
            // Se for bairro especial de Camboriú, adiciona R$ 35,00
            if (bairroEntregaInfo.tipoBairro === 'especial') {
                adicionalBairro = bairroEntregaInfo.valorAdicional; // R$ 35,00
                isBairroEspecial = true;
                tipoBairroEspecial = 'camboriu';
            }
        }
        
        return { valorBase, adicionalBairro, isBairroEspecial, tipoBairroEspecial };
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
            
            /* Estilos para os selects de bairro */
            .bairro-container {
                margin-bottom: 15px;
                display: none;
            }
            
            .bairro-container select {
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 14px;
            }
            
            .bairro-info {
                font-size: 12px;
                color: #666;
                margin-top: 5px;
                font-style: italic;
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
        const modalOrcamento = document.getElementById('orcamento-modal');
        if (!modalOrcamento) {
            console.error('Modal de orçamento não encontrado!');
            return;
        }
        
        modalOrcamento.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Resetar campos - COM VERIFICAÇÕES DE SEGURANÇA
        const elementosParaResetar = [
            'orcamento-resultado',
            'btn-confirmar',
            'endereco-detalhado-container',
            'bairro-coleta-container',
            'bairro-entrega-container'
        ];

        elementosParaResetar.forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                if (id === 'btn-confirmar' || id === 'orcamento-resultado') {
                    elemento.style.display = 'none';
                } else {
                    elemento.style.display = 'none';
                }
            }
        });

        // Limpar campos
        const camposParaLimpar = ['comprimento', 'largura', 'altura', 'peso', 'descricao', 'bairro-coleta', 'bairro-entrega'];
        camposParaLimpar.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) campo.value = '';
        });

        // Resetar selects principais
        const selectColeta = document.getElementById('local-coleta');
        if (selectColeta) selectColeta.selectedIndex = 0;
        
        const selectDestino = document.getElementById('cidade-destino');
        if (selectDestino) selectDestino.selectedIndex = 0;
        
        const enderecoDetalhado = document.getElementById('endereco-detalhado');
        if (enderecoDetalhado) enderecoDetalhado.value = '';
        
        const enderecoEntrega = document.getElementById('entrega-endereco');
        if (enderecoEntrega) enderecoEntrega.value = '';
        
        const clienteNome = document.getElementById('cliente-nome');
        if (clienteNome) clienteNome.value = '';
        
        const clienteTelefone = document.getElementById('cliente-telefone');
        if (clienteTelefone) clienteTelefone.value = '';
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
        const enderecoEntrega = document.getElementById('entrega-endereco');
        const bairroColetaSelect = document.getElementById('bairro-coleta');
        const bairroEntregaSelect = document.getElementById('bairro-entrega');

        if (!localColetaSelect || !enderecoDetalhado || !cidadeDestinoSelect || !enderecoEntrega) {
            console.error('Elementos do formulário não encontrados');
            mostrarToast('Erro no formulário!', 'error');
            return;
        }

        const localColetaId = localColetaSelect.value;
        const localColetaNome = localColetaSelect.options[localColetaSelect.selectedIndex].text;
        const enderecoColeta = enderecoDetalhado.value;
        const cidadeDestinoId = cidadeDestinoSelect.value;
        const cidadeDestinoNome = cidadeDestinoSelect.options[cidadeDestinoSelect.selectedIndex].text;
        
        // Obter informações dos bairros
        const bairroColetaInfo = obterValorBairroSelecionado('bairro-coleta', localColetaId);
        const bairroEntregaInfo = obterValorBairroSelecionado('bairro-entrega', cidadeDestinoId);
        
        const bairroColeta = bairroColetaInfo.nomeBairro;
        const bairroEntrega = bairroEntregaInfo.nomeBairro;

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

        // Obter valor base com verificação de bairros especiais
        const cidadeInfo = TABELA_PRECOS[cidadeDestinoId];
        if (!cidadeInfo) {
            mostrarToast('Cidade não encontrada na tabela de preços!', 'error');
            return;
        }

        // Calcular valores base e adicionais
        const { valorBase, adicionalBairro, isBairroEspecial, tipoBairroEspecial } =
            calcularValorBase(cidadeDestinoId, localColetaId, bairroColetaInfo, bairroEntregaInfo);

        // Adicional por tamanho (somente se não for bairro especial)
        let adicionalTamanho = 0;
        if (!isBairroEspecial && volumeCm3 > 30000) {
            adicionalTamanho = Math.floor(volumeCm3 / 30000) * 10;
        }

        // Adicional por peso (somente se não for bairro especial)
        let adicionalPeso = 0;
        if (!isBairroEspecial && peso > 5) {
            adicionalPeso = Math.floor((peso - 5)) * 5;
        }

        // Calcular total
        const total = valorBase + adicionalTamanho + adicionalPeso + adicionalBairro;
        const totalFinal = Math.min(total, cidadeInfo.max);

        // Salvar orçamento atual
        orcamentoAtual = {
            nome: document.getElementById('cliente-nome').value,
            telefone: document.getElementById('cliente-telefone').value,
            localColeta: localColetaNome,
            localColetaId: localColetaId,
            enderecoColeta: enderecoColeta,
            bairroColeta: bairroColeta,
            cidadeDestino: cidadeDestinoNome,
            cidadeDestinoId: cidadeDestinoId,
            enderecoEntrega: enderecoEntrega.value,
            bairroEntrega: bairroEntrega,
            dimensoes: `${comprimento}x${largura}x${altura}cm`,
            volume: volumeLitros.toFixed(1),
            peso: peso.toFixed(1),
            descricao: document.getElementById('descricao').value || 'Não informada',
            valores: {
                base: valorBase,
                tamanho: adicionalTamanho,
                peso: adicionalPeso,
                bairro: adicionalBairro,
                total: totalFinal
            },
            isBairroEspecial: isBairroEspecial,
            tipoBairroEspecial: tipoBairroEspecial,
            tipoBairroEntrega: bairroEntregaInfo.tipoBairro,
            data: new Date().toLocaleString('pt-BR'),
            timestamp: Date.now()
        };

        // Mostrar resultado do orçamento
        const valoresDetalhes = document.querySelector('.valores-detalhes');

        if (valoresDetalhes) {
            // Mostrar resultado
            document.getElementById('base-valor').textContent = formatarMoeda(valorBase);

            if (isBairroEspecial) {
                document.getElementById('tamanho-valor').textContent = formatarMoeda(0);
                document.getElementById('peso-valor').textContent = formatarMoeda(0);

                // Criar elemento para mostrar adicional de bairro se não existir
                let adicionalBairroElement = document.getElementById('bairro-valor');
                if (!adicionalBairroElement) {
                    const novoElemento = document.createElement('div');
                    novoElemento.id = 'bairro-valor';
                    novoElemento.className = 'valor-item';
                    const label = tipoBairroEspecial === 'itajai' ? 'Adicional bairro (Itajaí):' : 'Adicional bairro (Camboriú):';
                    novoElemento.innerHTML = `
                        <span>${label}</span>
                        <span>${formatarMoeda(adicionalBairro)}</span>
                    `;
                    valoresDetalhes.appendChild(novoElemento);
                } else {
                    const label = tipoBairroEspecial === 'itajai' ? 'Adicional bairro (Itajaí):' : 'Adicional bairro (Camboriú):';
                    adicionalBairroElement.innerHTML = `
                        <span>${label}</span>
                        <span>${formatarMoeda(adicionalBairro)}</span>
                    `;
                }
            } else {
                document.getElementById('tamanho-valor').textContent = formatarMoeda(adicionalTamanho);
                document.getElementById('peso-valor').textContent = formatarMoeda(adicionalPeso);

                // Remover elemento de adicional de bairro se existir
                const adicionalBairroElement = document.getElementById('bairro-valor');
                if (adicionalBairroElement && adicionalBairroElement.parentNode) {
                    adicionalBairroElement.remove();
                }
            }

            document.getElementById('total-valor').textContent = formatarMoeda(totalFinal);
        } else {
            console.error('Elemento .valores-detalhes não encontrado');
            // Fallback: usar IDs diretos se existirem
            const elementos = {
                'base-valor': document.getElementById('base-valor'),
                'tamanho-valor': document.getElementById('tamanho-valor'),
                'peso-valor': document.getElementById('peso-valor'),
                'total-valor': document.getElementById('total-valor')
            };

            for (const [id, element] of Object.entries(elementos)) {
                if (element) {
                    if (id === 'base-valor') element.textContent = formatarMoeda(valorBase);
                    if (id === 'tamanho-valor') element.textContent = formatarMoeda(isBairroEspecial ? 0 : adicionalTamanho);
                    if (id === 'peso-valor') element.textContent = formatarMoeda(isBairroEspecial ? 0 : adicionalPeso);
                    if (id === 'total-valor') element.textContent = formatarMoeda(totalFinal);
                }
            }
        }

        const orcamentoResultado = document.getElementById('orcamento-resultado');
        const btnConfirmar = document.getElementById('btn-confirmar');
        
        if (orcamentoResultado) orcamentoResultado.style.display = 'block';
        if (btnConfirmar) btnConfirmar.style.display = 'block';

        if (orcamentoResultado) {
            orcamentoResultado.scrollIntoView({ behavior: 'smooth' });
        }

        if (isBairroEspecial) {
            let mensagem = '';
            if (tipoBairroEspecial === 'itajai') {
                mensagem = 'Orçamento calculado com adicional para bairro especial de Itajaí!';
            } else if (tipoBairroEspecial === 'camboriu') {
                mensagem = 'Orçamento calculado com adicional para bairro distante de Camboriú!';
            }
            mostrarToast(mensagem, 'info');
        } else {
            mostrarToast('Orçamento calculado com sucesso!', 'success');
        }
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

        // Validação de bairro para cidades que têm bairros
        const localColeta = document.getElementById('local-coleta').value;
        const bairroColeta = document.getElementById('bairro-coleta');
        if (bairroColeta && bairroColeta.style.display !== 'none' && (!bairroColeta.value || bairroColeta.value === '')) {
            mostrarToast('Selecione o bairro de coleta!', 'error');
            bairroColeta.style.borderColor = '#f44336';
            bairroColeta.focus();
            return false;
        }

        const cidadeDestino = document.getElementById('cidade-destino').value;
        const bairroEntrega = document.getElementById('bairro-entrega');
        if (bairroEntrega && bairroEntrega.style.display !== 'none' && (!bairroEntrega.value || bairroEntrega.value === '')) {
            mostrarToast('Selecione o bairro de entrega!', 'error');
            bairroEntrega.style.borderColor = '#f44336';
            bairroEntrega.focus();
            return false;
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
            let bairroColetaHtml = orcamentoAtual.bairroColeta ?
                `<div class="comprovante-item">
                    <span class="comprovante-label">Bairro:</span>
                    <span class="comprovante-value">${orcamentoAtual.bairroColeta}</span>
                </div>` : '';

            let bairroEntregaHtml = orcamentoAtual.bairroEntrega ?
                `<div class="comprovante-item">
                    <span class="comprovante-label">Bairro:</span>
                    <span class="comprovante-value">${orcamentoAtual.bairroEntrega}</span>
                </div>` : '';

            let adicionalBairroHtml = '';
            let bairroInfoHtml = '';

            if (orcamentoAtual.isBairroEspecial) {
                const bairroTipo = orcamentoAtual.tipoBairroEspecial === 'itajai' ? 'Itajaí' : 'Camboriú';
                const bairroValor = orcamentoAtual.tipoBairroEspecial === 'itajai' ? 'R$ 20,00' : 'R$ 35,00';

                adicionalBairroHtml = `
                    <div class="comprovante-item">
                        <span class="comprovante-label">Adicional bairro (${bairroTipo}):</span>
                        <span class="comprovante-value">${formatarMoeda(orcamentoAtual.valores.bairro)}</span>
                    </div>
                `;

                if (orcamentoAtual.tipoBairroEspecial === 'camboriu') {
                    let origemInfo = '';
                    if (orcamentoAtual.localColetaId === 'camboriu') {
                        origemInfo = 'Coleta em Camboriú (R$ 15,00)';
                    } else if (orcamentoAtual.localColetaId === 'balneario-camboriu') {
                        origemInfo = 'Coleta em Balneário Camboriú (R$ 20,00)';
                    } else if (orcamentoAtual.localColetaId === 'itajai') {
                        origemInfo = 'Coleta em Itajaí (R$ 30,00)';
                    }
                    bairroInfoHtml = `<div style="font-size: 12px; color: #666; margin-top: 5px;">(${origemInfo} + ${bairroValor} adicional bairro distante)</div>`;
                } else {
                    bairroInfoHtml = `<div style="font-size: 12px; color: #666; margin-top: 5px;">(Bairro especial de Itajaí: R$ 30,00 + ${bairroValor} = R$ 50,00)</div>`;
                }
            }

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
                    ${bairroColetaHtml}
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
                    ${bairroEntregaHtml}
                    <div class="comprovante-item">
                        <span class="comprovante-label">Endereço:</span>
                        <span class="comprovante-value">${orcamentoAtual.enderecoEntrega}</span>
                    </div>
                    ${bairroInfoHtml}
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
                        ${orcamentoAtual.valores.bairro > 0 ? `<div>Adicional bairro: ${formatarMoeda(orcamentoAtual.valores.bairro)}</div>` : ''}
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
        const comprovanteModal = document.getElementById('comprovante-modal');
        if (comprovanteModal) {
            comprovanteModal.style.display = 'block';
        }

        mostrarToast('Comprovante gerado! Imprima e confirme no WhatsApp.', 'success');
    }

    function imprimirRecibo() {
        if (!orcamentoAtual) {
            mostrarToast('Gere o comprovante primeiro!', 'error');
            return;
        }

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
                    
                    .info-item {
                        margin-bottom: 8px;
                    }
                    
                    .info-label {
                        font-weight: bold;
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
                    
                    <div style="margin-bottom: 10px;">
                        <div class="info-item"><span class="info-label">🔢 PEDIDO:</span> ${orcamentoAtual.numeroPedido}</div>
                        <div class="info-item"><span class="info-label">📅 DATA/HORA:</span> ${orcamentoAtual.data}</div>
                    </div>
                    
                    <div class="separator"></div>
                    
                    <div style="margin-bottom: 10px;">
                        <div style="font-weight: bold; margin-bottom: 10px; font-size: 18px;">👤 CLIENTE</div>
                        <div class="info-item"><span class="info-label">Nome:</span> ${orcamentoAtual.nome}</div>
                        <div class="info-item"><span class="info-label">Telefone:</span> ${orcamentoAtual.telefone}</div>
                    </div>
                    
                    <div class="separator"></div>
                    
                    <div style="margin-bottom: 10px;">
                        <div style="font-weight: bold; margin-bottom: 10px; font-size: 18px;">📍 COLETA</div>
                        <div class="info-item"><span class="info-label">Local:</span> ${orcamentoAtual.localColeta}</div>
                        ${orcamentoAtual.bairroColeta ? `<div class="info-item"><span class="info-label">Bairro:</span> ${orcamentoAtual.bairroColeta}</div>` : ''}
                        <div class="info-item"><span class="info-label">Endereço:</span> ${orcamentoAtual.enderecoColeta}</div>
                    </div>
                    
                    <div class="separator"></div>
                    
                    <div style="margin-bottom: 10px;">
                        <div style="font-weight: bold; margin-bottom: 10px; font-size: 18px;">🎯 ENTREGA</div>
                        <div class="info-item"><span class="info-label">Cidade:</span> ${orcamentoAtual.cidadeDestino}</div>
                        ${orcamentoAtual.bairroEntrega ? `<div class="info-item"><span class="info-label">Bairro:</span> ${orcamentoAtual.bairroEntrega}</div>` : ''}
                        <div class="info-item"><span class="info-label">Endereço:</span> ${orcamentoAtual.enderecoEntrega}</div>
                        ${orcamentoAtual.isBairroEspecial ?
                `<div style="font-size: 12px; color: #666; margin-top: 5px; font-style: italic;">
                                ${orcamentoAtual.tipoBairroEspecial === 'itajai' ?
                    '(Bairro especial de Itajaí - R$ 30,00 + R$ 20,00)' :
                    '(Bairro distante de Camboriú - Valor ajustado conforme origem)'}
                            </div>` :
                ''}
                    </div>
                    
                    <div class="separator"></div>
                    
                    <div style="margin-bottom: 10px;">
                        <div style="font-weight: bold; margin-bottom: 10px; font-size: 18px;">📦 ENCOMENDA</div>
                        <div class="info-item"><span class="info-label">Dimensões:</span> ${orcamentoAtual.dimensoes}</div>
                        <div class="info-item"><span class="info-label">Peso:</span> ${orcamentoAtual.peso}kg</div>
                        <div class="info-item"><span class="info-label">Descrição:</span> ${orcamentoAtual.descricao}</div>
                    </div>
                    
                    <div class="separator"></div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="font-weight: bold; margin-bottom: 10px; font-size: 18px;">💰 VALORES</div>
                        <div class="info-item"><span class="info-label">Base:</span> ${formatarMoeda(orcamentoAtual.valores.base)}</div>
                        ${orcamentoAtual.valores.tamanho > 0 ? `<div class="info-item"><span class="info-label">Adicional tamanho:</span> ${formatarMoeda(orcamentoAtual.valores.tamanho)}</div>` : ''}
                        ${orcamentoAtual.valores.peso > 0 ? `<div class="info-item"><span class="info-label">Adicional peso:</span> ${formatarMoeda(orcamentoAtual.valores.peso)}</div>` : ''}
                        ${orcamentoAtual.valores.bairro > 0 ?
                `<div class="info-item">
                                <span class="info-label">Adicional bairro (${orcamentoAtual.tipoBairroEspecial === 'itajai' ? 'Itajaí' : 'Camboriú'}):</span> 
                                ${formatarMoeda(orcamentoAtual.valores.bairro)}
                            </div>` :
                ''}
                    </div>
                    
                    <div class="total-box">
                        <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">💵 TOTAL A PAGAR</div>
                        <div class="total-amount">${formatarMoeda(orcamentoAtual.valores.total)}</div>
                    </div>
                    
                    <div class="separator"></div>
                    
                    <div style="margin-bottom: 15px; font-size: 13px;">
                        <div style="font-weight: bold; margin-bottom: 10px;">📋 OBSERVAÇÕES</div>
                        <div>• Este é um orçamento/autorização de coleta</div>
                        <div>• Valor sujeito a confirmação após análise</div>
                        <div>• Aguarde contato para agendamento</div>
                        <div>• Pagamento na entrega</div>
                    </div>
                    
                    <div style="text-align: center; margin: 10px 0; padding: 10px; border: 2px solid #000; font-weight: bold; font-size: 16px;">
                        ✅ RECIBO AUTORIZADO ✅
                    </div>
                    
                    <div class="contact-info">
                        <div><strong>📞 CONTATO:</strong> (47) 99912-3260</div>
                        <div><strong>📧 E-MAIL:</strong> contato@ngexpress.com.br</div>
                        <div><strong>🌐 SITE:</strong> www.ngexpress.com.br</div>
                    </div>
                    
                    <div class="footer">
                        <div>===========================================</div>
                        <div style="font-weight: bold; margin: 5px 0;">OBRIGADO PELA PREFERÊNCIA!</div>
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

        // Mensagem formatada para WhatsApp
        let mensagem = `*NOVO PEDIDO - N&G EXPRESS*\n\n`;
        mensagem += `*Pedido:* ${orcamentoAtual.numeroPedido}\n`;
        mensagem += `*Data:* ${orcamentoAtual.data}\n\n`;
        mensagem += `*Cliente:*\n`;
        mensagem += `Nome: ${orcamentoAtual.nome}\n`;
        mensagem += `Telefone: ${orcamentoAtual.telefone}\n\n`;
        mensagem += `*COLETA:*\n`;
        mensagem += `Local: ${orcamentoAtual.localColeta}\n`;
        if (orcamentoAtual.bairroColeta) {
            mensagem += `Bairro: ${orcamentoAtual.bairroColeta}\n`;
        }
        mensagem += `Endereço: ${orcamentoAtual.enderecoColeta}\n\n`;
        mensagem += `*ENTREGA:*\n`;
        mensagem += `Cidade: ${orcamentoAtual.cidadeDestino}\n`;
        if (orcamentoAtual.bairroEntrega) {
            mensagem += `Bairro: ${orcamentoAtual.bairroEntrega}\n`;
        }
        mensagem += `Endereço: ${orcamentoAtual.enderecoEntrega}\n`;

        // Adicionar tipo de bairro especial se houver
        if (orcamentoAtual.isBairroEspecial) {
            if (orcamentoAtual.tipoBairroEspecial === 'itajai') {
                mensagem += `*Tipo:* Bairro Especial de Itajaí\n`;
            } else if (orcamentoAtual.tipoBairroEspecial === 'camboriu') {
                mensagem += `*Tipo:* Bairro Distante de Camboriú\n`;
            }
        }

        mensagem += `\n*ENCOMENDA:*\n`;
        mensagem += `Dimensões: ${orcamentoAtual.dimensoes}\n`;
        mensagem += `Peso: ${orcamentoAtual.peso}kg\n`;
        mensagem += `Descrição: ${orcamentoAtual.descricao}\n\n`;
        mensagem += `*VALORES:*\n`;
        mensagem += `Base: ${formatarMoeda(orcamentoAtual.valores.base)}\n`;

        if (orcamentoAtual.valores.tamanho > 0) {
            mensagem += `Adicional tamanho: ${formatarMoeda(orcamentoAtual.valores.tamanho)}\n`;
        }

        if (orcamentoAtual.valores.peso > 0) {
            mensagem += `Adicional peso: ${formatarMoeda(orcamentoAtual.valores.peso)}\n`;
        }

        if (orcamentoAtual.valores.bairro > 0) {
            if (orcamentoAtual.tipoBairroEspecial === 'itajai') {
                mensagem += `Adicional bairro (Itajaí): ${formatarMoeda(orcamentoAtual.valores.bairro)}\n`;
            } else if (orcamentoAtual.tipoBairroEspecial === 'camboriu') {
                mensagem += `Adicional bairro (Camboriú): ${formatarMoeda(orcamentoAtual.valores.bairro)}\n`;
            }
        }

        mensagem += `\n*TOTAL: ${formatarMoeda(orcamentoAtual.valores.total)}*\n\n`;
        mensagem += `Confirme este pedido para iniciar a coleta.`;

        const telefoneWhatsApp = '5547999123260';
        const whatsappUrl = `https://wa.me/${telefoneWhatsApp}?text=${encodeURIComponent(mensagem)}`;

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
        if (!toastContainer) {
            console.warn('Container de toast não encontrado');
            return;
        }

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
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    };
});