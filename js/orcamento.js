// Sistema de orçamento - VERSÃO ATUALIZADA
document.addEventListener('DOMContentLoaded', function () {
    console.log('Script de orçamento carregado com sucesso!');

    // Tabela de preços baseada nas imagens - ATUALIZADA
    const TABELA_PRECOS = {
        'balneario-camboriu': { min: 20, max: 30, descricao: 'Balneário Camboriú' },
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

    // Bairros de Itajaí com valor adicional de R$ 20,00
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
    let numeroPedidoGerado = null;

    // FUNÇÃO PARA RESETAR ORÇAMENTO
    function resetarOrcamento() {
        console.log('Resetando orçamento...');

        // Limpar resultado do orçamento
        const orcamentoResultado = document.getElementById('orcamento-resultado');
        if (orcamentoResultado) {
            orcamentoResultado.style.display = 'none';
            orcamentoResultado.innerHTML = '';
        }

        // Esconder botão de confirmar
        const btnConfirmar = document.getElementById('btn-confirmar');
        if (btnConfirmar) {
            btnConfirmar.style.display = 'none';
        }

        // Mostrar botão de calcular
        const btnCalcular = document.getElementById('btn-calcular');
        if (btnCalcular) {
            btnCalcular.style.display = 'block';
            btnCalcular.innerHTML = '<i class="bi bi-calculator"></i> Calcular Orçamento';
            btnCalcular.onclick = calcularOrcamento;
        }

        // Habilitar campos para edição
        habilitarCampos(true);

        // Resetar variáveis
        orcamentoAtual = null;
        numeroPedidoGerado = null;

        // Scroll para o botão de calcular
        if (btnCalcular) {
            btnCalcular.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }

        mostrarToast('Orçamento resetado. Você pode editar os dados e recalcular.', 'info');
    }

    // FUNÇÃO PARA HABILITAR/DESABILITAR CAMPOS
    function habilitarCampos(habilitar) {
        const campos = [
            'cliente-nome',
            'cliente-telefone',
            'cliente-email',
            'local-coleta',
            'bairro-coleta',
            'endereco-detalhado',
            'cidade-destino',
            'bairro-entrega',
            'entrega-endereco',
            'comprimento',
            'largura',
            'altura',
            'peso',
            'descricao'
        ];

        campos.forEach(campoId => {
            const campo = document.getElementById(campoId);
            if (campo) {
                campo.disabled = !habilitar;
                campo.style.backgroundColor = habilitar ? '#fff' : '#f8f9fa';
                campo.style.cursor = habilitar ? 'text' : 'not-allowed';
            }
        });
    }

    // Função para inicializar todos os componentes
    function inicializarSistema() {
        console.log('Inicializando sistema de orçamento...');

        // Configurar locais de coleta
        configurarLocaisColeta();

        // Atualizar select de cidades
        atualizarSelectCidades();

        // Aplicar máscara de telefone
        aplicarMascaraTelefone();

        console.log('Sistema inicializado com sucesso!');
    }

    // Configurar locais de coleta
    function configurarLocaisColeta() {
        console.log('Configurando locais de coleta...');

        const selectColeta = document.getElementById('local-coleta');
        const bairroColetaContainer = document.getElementById('bairro-coleta-container');
        const selectBairroColeta = document.getElementById('bairro-coleta');
        const enderecoDetalhadoContainer = document.getElementById('endereco-detalhado-container');

        if (!selectColeta) {
            console.error('Elemento #local-coleta não encontrado!');
            return;
        }

        // Limpar select
        selectColeta.innerHTML = '';

        // Adicionar opção padrão
        const optionPadrao = document.createElement('option');
        optionPadrao.value = '';
        optionPadrao.textContent = 'Selecione o local de coleta';
        optionPadrao.disabled = true;
        optionPadrao.selected = true;
        selectColeta.appendChild(optionPadrao);

        // Adicionar opções
        const opcoesColeta = [
            { id: 'balneario-camboriu', nome: 'Balneário Camboriú', temBairros: false },
            { id: 'camboriu', nome: 'Camboriú', temBairros: true },
            { id: 'itajai', nome: 'Itajaí', temBairros: true }
        ];

        opcoesColeta.forEach(opcao => {
            const option = document.createElement('option');
            option.value = opcao.id;
            option.textContent = opcao.nome;
            option.dataset.temBairros = opcao.temBairros;
            selectColeta.appendChild(option);
        });

        // Event listener para mostrar/ocultar bairros
        selectColeta.addEventListener('change', function () {
            const temBairros = this.options[this.selectedIndex].dataset.temBairros === 'true';
            const cidadeSelecionada = this.value;

            if (temBairros && bairroColetaContainer && selectBairroColeta) {
                bairroColetaContainer.style.display = 'block';
                preencherBairrosColeta(cidadeSelecionada);
            } else if (bairroColetaContainer) {
                bairroColetaContainer.style.display = 'none';
                if (selectBairroColeta) {
                    selectBairroColeta.innerHTML = '<option value="" disabled selected>Selecione o bairro</option>';
                }
            }

            // Mostrar campo de endereço detalhado
            if (enderecoDetalhadoContainer && cidadeSelecionada) {
                enderecoDetalhadoContainer.style.display = 'block';
                const enderecoInput = document.getElementById('endereco-detalhado');
                if (enderecoInput) {
                    const cidadeNome = this.options[this.selectedIndex].text;
                    enderecoInput.placeholder = `Digite o endereço completo em ${cidadeNome}`;
                    enderecoInput.value = '';
                }
            } else if (enderecoDetalhadoContainer) {
                enderecoDetalhadoContainer.style.display = 'none';
            }
        });

        console.log('Locais de coleta configurados!');
    }

    // Função para preencher bairros de coleta
    function preencherBairrosColeta(cidadeId) {
        const selectBairroColeta = document.getElementById('bairro-coleta');
        if (!selectBairroColeta) return;

        // Limpar opções
        selectBairroColeta.innerHTML = '';

        // Adicionar opção padrão
        const optionPadrao = document.createElement('option');
        optionPadrao.value = '';
        optionPadrao.textContent = 'Selecione o bairro';
        optionPadrao.disabled = true;
        optionPadrao.selected = true;
        selectBairroColeta.appendChild(optionPadrao);

        if (cidadeId === 'itajai') {
            // Separador para bairros normais
            const separadorNormais = document.createElement('option');
            separadorNormais.disabled = true;
            separadorNormais.textContent = '── Bairros Normais ──';
            selectBairroColeta.appendChild(separadorNormais);

            // Bairros normais de Itajaí
            BAIRROS_ITAJAI_NORMAIS.forEach(bairro => {
                const option = document.createElement('option');
                option.value = bairro.toLowerCase();
                option.textContent = bairro;
                option.dataset.valor = 0;
                option.dataset.tipo = 'normal';
                selectBairroColeta.appendChild(option);
            });

            // Separador para bairros especiais
            const separadorEspeciais = document.createElement('option');
            separadorEspeciais.disabled = true;
            separadorEspeciais.textContent = '── Bairros Especiais ──';
            selectBairroColeta.appendChild(separadorEspeciais);

            // Bairros especiais de Itajaí
            BAIRROS_ITAJAI_ADICIONAL.forEach(bairro => {
                const option = document.createElement('option');
                option.value = bairro.nome.toLowerCase();
                option.textContent = bairro.nome;
                option.dataset.valor = bairro.valor;
                option.dataset.tipo = 'especial';
                selectBairroColeta.appendChild(option);
            });

        } else if (cidadeId === 'camboriu') {
            // Separador para bairros normais
            const separadorNormais = document.createElement('option');
            separadorNormais.disabled = true;
            separadorNormais.textContent = '── Bairros Normais ──';
            selectBairroColeta.appendChild(separadorNormais);

            // Bairros normais de Camboriú
            BAIRROS_CAMBORIU_NORMAIS.forEach(bairro => {
                const option = document.createElement('option');
                option.value = bairro.toLowerCase();
                option.textContent = bairro;
                option.dataset.valor = 0;
                option.dataset.tipo = 'normal';
                selectBairroColeta.appendChild(option);
            });

            // Separador para bairros especiais
            const separadorEspeciais = document.createElement('option');
            separadorEspeciais.disabled = true;
            separadorEspeciais.textContent = '── Bairros Especiais ──';
            selectBairroColeta.appendChild(separadorEspeciais);

            // Bairros especiais de Camboriú
            BAIRROS_CAMBORIU_ADICIONAL.forEach(bairro => {
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
    }

    // Atualizar select de cidades de destino
    function atualizarSelectCidades() {
        console.log('Atualizando select de cidades...');

        const selectDestino = document.getElementById('cidade-destino');
        const bairroEntregaContainer = document.getElementById('bairro-entrega-container');

        if (!selectDestino) {
            console.error('Elemento #cidade-destino não encontrado!');
            return;
        }

        // Limpar opções existentes
        selectDestino.innerHTML = '';

        // Adicionar opção padrão
        const optionPadrao = document.createElement('option');
        optionPadrao.value = '';
        optionPadrao.textContent = 'Selecione a cidade de destino';
        optionPadrao.disabled = true;
        optionPadrao.selected = true;
        selectDestino.appendChild(optionPadrao);

        // Adicionar cidades na ordem correta
        const cidadesOrdenadas = [
            'balneario-camboriu', 'camboriu', 'itajai',
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
                option.dataset.temBairros = (cidadeId === 'itajai' || cidadeId === 'camboriu') ? 'true' : 'false';
                selectDestino.appendChild(option);
            }
        });

        // Event listener para mostrar/ocultar bairros de entrega
        selectDestino.addEventListener('change', function () {
            const cidadeId = this.value;
            const temBairros = this.options[this.selectedIndex].dataset.temBairros === 'true';

            if (temBairros && bairroEntregaContainer) {
                bairroEntregaContainer.style.display = 'block';
                preencherBairrosEntrega(cidadeId);
            } else if (bairroEntregaContainer) {
                bairroEntregaContainer.style.display = 'none';
                const selectBairroEntrega = document.getElementById('bairro-entrega');
                if (selectBairroEntrega) {
                    selectBairroEntrega.innerHTML = '<option value="" disabled selected>Selecione o bairro</option>';
                }
            }
        });

        console.log('Select de cidades atualizado!');
    }

    // Função para preencher bairros de entrega
    function preencherBairrosEntrega(cidadeId) {
        const selectBairroEntrega = document.getElementById('bairro-entrega');
        if (!selectBairroEntrega) return;

        // Limpar opções
        selectBairroEntrega.innerHTML = '';

        // Adicionar opção padrão
        const optionPadrao = document.createElement('option');
        optionPadrao.value = '';
        optionPadrao.textContent = 'Selecione o bairro';
        optionPadrao.disabled = true;
        optionPadrao.selected = true;
        selectBairroEntrega.appendChild(optionPadrao);

        if (cidadeId === 'itajai') {
            // Separador para bairros normais
            const separadorNormais = document.createElement('option');
            separadorNormais.disabled = true;
            separadorNormais.textContent = '── Bairros Normais ──';
            selectBairroEntrega.appendChild(separadorNormais);

            // Bairros normais de Itajaí
            BAIRROS_ITAJAI_NORMAIS.forEach(bairro => {
                const option = document.createElement('option');
                option.value = bairro.toLowerCase();
                option.textContent = bairro;
                option.dataset.valor = 0;
                option.dataset.tipo = 'normal';
                selectBairroEntrega.appendChild(option);
            });

            // Separador para bairros especiais
            const separadorEspeciais = document.createElement('option');
            separadorEspeciais.disabled = true;
            separadorEspeciais.textContent = '── Bairros Especiais ──';
            selectBairroEntrega.appendChild(separadorEspeciais);

            // Bairros especiais de Itajaí
            BAIRROS_ITAJAI_ADICIONAL.forEach(bairro => {
                const option = document.createElement('option');
                option.value = bairro.nome.toLowerCase();
                option.textContent = bairro.nome;
                option.dataset.valor = bairro.valor;
                option.dataset.tipo = 'especial';
                selectBairroEntrega.appendChild(option);
            });

        } else if (cidadeId === 'camboriu') {
            // Separador para bairros normais
            const separadorNormais = document.createElement('option');
            separadorNormais.disabled = true;
            separadorNormais.textContent = '── Bairros Normais ──';
            selectBairroEntrega.appendChild(separadorNormais);

            // Bairros normais de Camboriú
            BAIRROS_CAMBORIU_NORMAIS.forEach(bairro => {
                const option = document.createElement('option');
                option.value = bairro.toLowerCase();
                option.textContent = bairro;
                option.dataset.valor = 0;
                option.dataset.tipo = 'normal';
                selectBairroEntrega.appendChild(option);
            });

            // Separador para bairros especiais
            const separadorEspeciais = document.createElement('option');
            separadorEspeciais.disabled = true;
            separadorEspeciais.textContent = '── Bairros Especiais ──';
            selectBairroEntrega.appendChild(separadorEspeciais);

            // Bairros especiais de Camboriú
            BAIRROS_CAMBORIU_ADICIONAL.forEach(bairro => {
                const option = document.createElement('option');
                option.value = bairro.nome.toLowerCase();
                option.textContent = bairro.nome;
                option.dataset.valor = bairro.valor;
                option.dataset.tipo = 'especial';
                selectBairroEntrega.appendChild(option);
            });
        }

        // Opção "Outro bairro"
        const optionOutro = document.createElement('option');
        optionOutro.value = 'outro';
        optionOutro.textContent = 'Outro bairro';
        optionOutro.dataset.valor = 0;
        optionOutro.dataset.tipo = 'normal';
        selectBairroEntrega.appendChild(optionOutro);
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

    // Função para obter valor do bairro selecionado
    function obterValorBairroSelecionado(bairroSelectId, cidadeId) {
        const select = document.getElementById(bairroSelectId);
        if (!select || !select.value || select.value === '') {
            return {
                valorAdicional: 0,
                tipoBairro: 'normal',
                nomeBairro: ''
            };
        }

        const selectedOption = select.options[select.selectedIndex];
        const valorAdicional = parseInt(selectedOption.dataset.valor) || 0;
        const tipoBairro = selectedOption.dataset.tipo || 'normal';

        return {
            valorAdicional: valorAdicional,
            tipoBairro: tipoBairro,
            nomeBairro: selectedOption.text
        };
    }

    // FUNÇÃO CORRIGIDA: Calcular valor base com regras específicas para coleta e entrega
    function calcularValorBase(localColetaId, cidadeDestinoId, bairroColetaInfo, bairroEntregaInfo) {
        let valorBase = 0;
        let adicionalBairro = 0;
        let isBairroEspecial = false;
        let tipoBairroEspecial = '';

        console.log('Calculando valores:');
        console.log('Coleta:', localColetaId, 'Bairro coleta:', bairroColetaInfo);
        console.log('Entrega:', cidadeDestinoId, 'Bairro entrega:', bairroEntregaInfo);

        // REGRA 1: Mesma cidade (Camboriú para Camboriú)
        if (localColetaId === 'camboriu' && cidadeDestinoId === 'camboriu') {
            valorBase = 15; // Valor base para Camboriú → Camboriú

            // VERIFICAÇÃO: Se o bairro de ENTREGA OU COLETA é especial
            if (bairroEntregaInfo.tipoBairro === 'especial' || bairroColetaInfo.tipoBairro === 'especial') {
                adicionalBairro = 25; // +25 para bairro especial (coleta OU entrega)
                isBairroEspecial = true;
                tipoBairroEspecial = 'camboriu';
                console.log('Aplicado adicional +25 para bairro especial Camboriú (mesma cidade)');
            }
        }
        // REGRA 2: Camboriú (qualquer bairro) para Balneário Camboriú
        else if (localColetaId === 'camboriu' && cidadeDestinoId === 'balneario-camboriu') {
            valorBase = 20; // Valor base normal

            // VERIFICAÇÃO: Se o bairro de COLETA é especial
            if (bairroColetaInfo.tipoBairro === 'especial') {
                valorBase = 45; // 20 + 25 = 45,00
                isBairroEspecial = true;
                tipoBairroEspecial = 'camboriu';
                console.log('Aplicado valor 45 para Camboriú bairro especial → Balneário');
            }
        }
        // REGRA 3: Balneário Camboriú para Camboriú
        else if (localColetaId === 'balneario-camboriu' && cidadeDestinoId === 'camboriu') {
            valorBase = 20; // Valor base normal

            // VERIFICAÇÃO: Se o bairro de ENTREGA é especial
            if (bairroEntregaInfo.tipoBairro === 'especial') {
                valorBase = 45; // 20 + 25 = 45,00
                isBairroEspecial = true;
                tipoBairroEspecial = 'camboriu';
                console.log('Aplicado valor 45 para Balneário → Camboriú bairro especial');
            }
        }
        // REGRA 4: Camboriú para Itajaí
        else if (localColetaId === 'camboriu' && cidadeDestinoId === 'itajai') {
            // Se bairro de coleta NORMAL e bairro de entrega NORMAL
            if (bairroColetaInfo.tipoBairro === 'normal' && bairroEntregaInfo.tipoBairro === 'normal') {
                valorBase = 40; // 20 + 20 = 40,00
            }
            // Se bairro de coleta ESPECIAL e/ou bairro de entrega ESPECIAL
            else if (bairroColetaInfo.tipoBairro === 'especial' || bairroEntregaInfo.tipoBairro === 'especial') {
                valorBase = 65; // 25 + 40 = 65,00
                isBairroEspecial = true;
                tipoBairroEspecial = 'camboriu-itajai';
                console.log('Aplicado valor 65 para Camboriú bairro especial → Itajaí bairro especial');
            }
        }
        // REGRA 5: Itajaí para Camboriú
        else if (localColetaId === 'itajai' && cidadeDestinoId === 'camboriu') {
            // Se bairro de coleta NORMAL e bairro de entrega NORMAL
            if (bairroColetaInfo.tipoBairro === 'normal' && bairroEntregaInfo.tipoBairro === 'normal') {
                valorBase = 40; // 20 + 20 = 40,00
            }
            // Se bairro de coleta ESPECIAL e/ou bairro de entrega ESPECIAL
            else if (bairroColetaInfo.tipoBairro === 'especial' || bairroEntregaInfo.tipoBairro === 'especial') {
                valorBase = 65; // 25 + 40 = 65,00
                isBairroEspecial = true;
                tipoBairroEspecial = 'itajai-camboriu';
                console.log('Aplicado valor 65 para Itajaí bairro especial → Camboriú bairro especial');
            }
        }
        // REGRA 6: Balneário Camboriú para Itajaí
        else if (localColetaId === 'balneario-camboriu' && cidadeDestinoId === 'itajai') {
            valorBase = 30; // Valor base normal

            // VERIFICAÇÃO: Se o bairro de ENTREGA é especial
            if (bairroEntregaInfo.tipoBairro === 'especial') {
                valorBase = 50; // 30 + 20 = 50,00
                isBairroEspecial = true;
                tipoBairroEspecial = 'itajai';
                console.log('Aplicado valor 50 para Balneário → Itajaí bairro especial');
            }
        }
        // REGRA 7: Itajaí para Balneário Camboriú
        else if (localColetaId === 'itajai' && cidadeDestinoId === 'balneario-camboriu') {
            valorBase = 30; // Valor base normal

            // VERIFICAÇÃO: Se o bairro de COLETA é especial
            if (bairroColetaInfo.tipoBairro === 'especial') {
                valorBase = 50; // 30 + 20 = 50,00
                isBairroEspecial = true;
                tipoBairroEspecial = 'itajai';
                console.log('Aplicado valor 50 para Itajaí bairro especial → Balneário');
            }
        }
        // REGRA 8: Balneário Camboriú para Balneário Camboriú (mesma cidade)
        else if (localColetaId === 'balneario-camboriu' && cidadeDestinoId === 'balneario-camboriu') {
            valorBase = 15; // 15,00 (não há bairros especiais em Balneário)
        }
        // REGRA 9: Itajaí para Itajaí (mesma cidade)
        else if (localColetaId === 'itajai' && cidadeDestinoId === 'itajai') {
            valorBase = 15; // Valor base

            // VERIFICAÇÃO: Se o bairro de ENTREGA OU COLETA é especial
            if (bairroEntregaInfo.tipoBairro === 'especial' || bairroColetaInfo.tipoBairro === 'especial') {
                valorBase = 40; // 15 + 25 = 40,00
                isBairroEspecial = true;
                tipoBairroEspecial = 'itajai';
                console.log('Aplicado valor 40 para Itajaí bairro especial → Itajaí (mesma cidade)');
            }
        }
        // REGRA 10: Outras cidades (usar tabela de preços)
        else {
            // Usar valor da tabela de preços
            valorBase = TABELA_PRECOS[cidadeDestinoId] ? TABELA_PRECOS[cidadeDestinoId].min : 0;

            // Verificar se destino é Camboriú e bairro de entrega é especial
            if (cidadeDestinoId === 'camboriu' && bairroEntregaInfo.tipoBairro === 'especial') {
                adicionalBairro = 35; // +35 para bairro especial de Camboriú
                isBairroEspecial = true;
                tipoBairroEspecial = 'camboriu';
                console.log('Aplicado adicional +35 para bairro especial de Camboriú');
            }

            // Verificar se destino é Itajaí e bairro de entrega é especial
            if (cidadeDestinoId === 'itajai' && bairroEntregaInfo.tipoBairro === 'especial') {
                adicionalBairro = 20; // +20 para bairro especial de Itajaí
                isBairroEspecial = true;
                tipoBairroEspecial = 'itajai';
                console.log('Aplicado adicional +20 para bairro especial de Itajaí');
            }
        }

        console.log('Resultado cálculo:', {
            valorBase,
            adicionalBairro,
            totalBase: valorBase + adicionalBairro,
            isBairroEspecial,
            tipoBairroEspecial
        });

        return {
            valorBase: valorBase + adicionalBairro,
            adicionalBairro,
            isBairroEspecial,
            tipoBairroEspecial
        };
    }

    // FUNÇÃO CORRIGIDA: calcularOrcamento
    function calcularOrcamento() {
        console.log('Iniciando cálculo do orçamento...');

        if (!validarFormulario()) {
            console.log('Formulário inválido');
            return;
        }

        const localColetaId = document.getElementById('local-coleta').value;
        const localColetaNome = document.getElementById('local-coleta').options[document.getElementById('local-coleta').selectedIndex].text;
        const cidadeDestinoId = document.getElementById('cidade-destino').value;
        const cidadeDestinoNome = document.getElementById('cidade-destino').options[document.getElementById('cidade-destino').selectedIndex].text;

        const bairroColetaInfo = obterValorBairroSelecionado('bairro-coleta', localColetaId);
        const bairroEntregaInfo = obterValorBairroSelecionado('bairro-entrega', cidadeDestinoId);

        const comprimento = parseFloat(document.getElementById('comprimento').value) || 0;
        const largura = parseFloat(document.getElementById('largura').value) || 0;
        const altura = parseFloat(document.getElementById('altura').value) || 0;
        const peso = parseFloat(document.getElementById('peso').value) || 0;

        console.log('Dados coletados:', {
            localColetaId, cidadeDestinoId, comprimento, largura, altura, peso,
            bairroColetaInfo, bairroEntregaInfo
        });

        const { valorBase, adicionalBairro, isBairroEspecial, tipoBairroEspecial } =
            calcularValorBase(localColetaId, cidadeDestinoId, bairroColetaInfo, bairroEntregaInfo);

        const volumeCm3 = comprimento * largura * altura;

        let adicionalTamanho = 0;
        if (!isBairroEspecial && volumeCm3 > 30000) {
            adicionalTamanho = Math.floor(volumeCm3 / 30000) * 10;
        }

        let adicionalPeso = 0;
        if (!isBairroEspecial && peso > 5) {
            adicionalPeso = Math.floor((peso - 5)) * 5;
        }

        const cidadeInfo = TABELA_PRECOS[cidadeDestinoId];
        const valorMaximo = cidadeInfo ? cidadeInfo.max : 999;

        const total = valorBase + adicionalTamanho + adicionalPeso + adicionalBairro;
        const totalFinal = Math.min(total, valorMaximo);

        console.log('Cálculos finais:', {
            valorBase, adicionalTamanho, adicionalPeso, adicionalBairro,
            total, totalFinal, valorMaximo
        });

        orcamentoAtual = {
            nome: document.getElementById('cliente-nome').value,
            telefone: document.getElementById('cliente-telefone').value,
            email: document.getElementById('cliente-email').value || '', // NOVO CAMPO: email
            localColeta: localColetaNome,
            localColetaId: localColetaId,
            enderecoColeta: document.getElementById('endereco-detalhado').value,
            bairroColeta: bairroColetaInfo.nomeBairro,
            cidadeDestino: cidadeDestinoNome,
            cidadeDestinoId: cidadeDestinoId,
            enderecoEntrega: document.getElementById('entrega-endereco').value,
            bairroEntrega: bairroEntregaInfo.nomeBairro,
            dimensoes: `${comprimento}x${largura}x${altura}cm`,
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
            data: new Date().toLocaleString('pt-BR'),
            timestamp: Date.now()
        };

        // Exibir APENAS o valor total
        exibirResultadoOrcamentoAPENASValorTotal(totalFinal);

        // OCULTAR BOTÃO CALCULAR após cálculo
        const btnCalcular = document.getElementById('btn-calcular');
        if (btnCalcular) {
            btnCalcular.style.display = 'none';
        }

        // Desabilitar campos após cálculo
        habilitarCampos(false);

        // Mostrar toast sem mencionar adicionais
        mostrarToast('Orçamento calculado com sucesso!', 'success');
    }

    // NOVA FUNÇÃO: Exibir APENAS o valor total (VERSÃO ATUALIZADA)
    function exibirResultadoOrcamentoAPENASValorTotal(totalFinal) {
        console.log('Exibindo APENAS valor total:', totalFinal);

        const orcamentoResultado = document.getElementById('orcamento-resultado');
        if (!orcamentoResultado) {
            console.error('Elemento #orcamento-resultado não encontrado!');
            return;
        }

        // Limpar completamente e criar APENAS o valor total
        orcamentoResultado.innerHTML = `
            <div style="
                background: white;
                border-radius: 15px;
                padding: 30px;
                margin: 20px 0;
                text-align: center;
                border: 3px solid #28a745;
                box-shadow: 0 10px 30px rgba(40, 167, 69, 0.15);
                animation: fadeIn 0.5s ease-out;
                position: relative;
            ">
                <!-- Botão de editar no canto superior direito -->
                <div style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    cursor: pointer;
                    color: #6c757d;
                    font-size: 14px;
                    background: #f8f9fa;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                " onclick="resetarOrcamento()" title="Editar dados">
                    <i class="bi bi-pencil"></i>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <i class="bi bi-check-circle-fill" style="font-size: 48px; color: #28a745;"></i>
                </div>
                
                <h3 style="color: #333; margin-bottom: 15px; font-size: 20px;">
                    <i class="bi bi-calculator"></i> ORÇAMENTO CALCULADO
                </h3>
                
                <div style="
                    font-size: 16px;
                    color: #666;
                    margin-bottom: 25px;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 10px;
                    border-left: 4px solid #28a745;
                ">
                    Valor total para entrega
                </div>
                
                <div id="total-valor" style="
                    font-size: 48px;
                    font-weight: bold;
                    color: #28a745;
                    margin: 20px 0;
                    padding: 20px;
                    background: linear-gradient(135deg, #f8fff9 0%, #e8f5e9 100%);
                    border-radius: 12px;
                    border: 2px solid #c3e6cb;
                ">
                    ${formatarMoeda(totalFinal)}
                </div>
                
                <div style="
                    font-size: 14px;
                    color: #6c757d;
                    margin-top: 15px;
                    padding: 10px;
                    background: #fff;
                    border-radius: 8px;
                    border: 1px solid #e9ecef;
                ">
                    <i class="bi bi-info-circle"></i> Valor final para o cliente
                </div>
                
                <!-- Botão para editar dados -->
                <button onclick="resetarOrcamento()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-left: auto;
                    margin-right: auto;
                    transition: background 0.3s;
                ">
                    <i class="bi bi-pencil-square"></i> Editar Dados
                </button>
            </div>
            
            <style>
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                button:hover {
                    background: #5a6268;
                }
            </style>
        `;

        orcamentoResultado.style.display = 'block';

        const btnConfirmar = document.getElementById('btn-confirmar');
        if (btnConfirmar) {
            btnConfirmar.style.display = 'block';
        }

        setTimeout(() => {
            orcamentoResultado.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);

        console.log('APENAS valor total exibido:', totalFinal);
    }

    // FUNÇÃO CORRIGIDA: validarFormulario
    function validarFormulario() {
        console.log('Validando formulário...');

        const campos = [
            'cliente-nome',
            'cliente-telefone',
            'cliente-email', // NOVO CAMPO: email
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
            if (!campo) {
                console.error(`Campo ${campoId} não encontrado`);
                mostrarToast(`Erro: campo ${campoId} não encontrado`, 'error');
                return false;
            }

            if (!campo.value.trim()) {
                console.log(`Campo ${campoId} está vazio`);
                campo.style.borderColor = '#dc3545';
                campo.focus();
                mostrarToast(`Preencha o campo: ${campo.placeholder || campoId}`, 'error');
                return false;
            } else {
                campo.style.borderColor = '';
            }
        }

        // Validar email (opcional, mas se preenchido, deve ser válido)
        const emailInput = document.getElementById('cliente-email');
        if (emailInput && emailInput.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.value.trim())) {
                mostrarToast('Por favor, insira um email válido!', 'error');
                emailInput.style.borderColor = '#dc3545';
                emailInput.focus();
                return false;
            }
        }

        const localColetaId = document.getElementById('local-coleta').value;
        const bairroColetaContainer = document.getElementById('bairro-coleta-container');
        const bairroColetaSelect = document.getElementById('bairro-coleta');

        if (bairroColetaContainer && bairroColetaSelect &&
            bairroColetaContainer.style.display !== 'none' &&
            (!bairroColetaSelect.value || bairroColetaSelect.value === '')) {
            mostrarToast('Selecione o bairro de coleta!', 'error');
            bairroColetaSelect.style.borderColor = '#dc3545';
            bairroColetaSelect.focus();
            return false;
        }

        const cidadeDestinoId = document.getElementById('cidade-destino').value;
        const bairroEntregaContainer = document.getElementById('bairro-entrega-container');
        const bairroEntregaSelect = document.getElementById('bairro-entrega');

        if (bairroEntregaContainer && bairroEntregaSelect &&
            bairroEntregaContainer.style.display !== 'none' &&
            (!bairroEntregaSelect.value || bairroEntregaSelect.value === '')) {
            mostrarToast('Selecione o bairro de entrega!', 'error');
            bairroEntregaSelect.style.borderColor = '#dc3545';
            bairroEntregaSelect.focus();
            return false;
        }

        const telefone = document.getElementById('cliente-telefone').value;
        const telefoneDigits = telefone.replace(/\D/g, '');
        if (telefoneDigits.length < 10) {
            mostrarToast('Telefone deve ter pelo menos 10 dígitos!', 'error');
            document.getElementById('cliente-telefone').style.borderColor = '#dc3545';
            document.getElementById('cliente-telefone').focus();
            return false;
        }

        const comprimento = parseFloat(document.getElementById('comprimento').value) || 0;
        const largura = parseFloat(document.getElementById('largura').value) || 0;
        const altura = parseFloat(document.getElementById('altura').value) || 0;
        const peso = parseFloat(document.getElementById('peso').value) || 0;

        if (comprimento > 200 || largura > 200 || altura > 200) {
            mostrarToast('As dimensões não podem ultrapassar 200cm!', 'error');
            return false;
        }

        if (peso > 50) {
            mostrarToast('O peso não pode ultrapassar 50kg!', 'error');
            return false;
        }

        console.log('Formulário validado com sucesso!');
        return true;
    }

    // FUNÇÃO CORRIGIDA: mostrarToast
    window.mostrarToast = function (mensagem, tipo = 'success') {
        console.log(`Toast [${tipo}]: ${mensagem}`);

        const oldToasts = document.querySelectorAll('.custom-toast');
        oldToasts.forEach(toast => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });

        const toast = document.createElement('div');
        toast.className = `custom-toast toast-${tipo}`;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${tipo === 'success' ? '#28a745' : tipo === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 9999;
            animation: toastSlideIn 0.3s ease-out;
            max-width: 300px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: Arial, sans-serif;
            font-size: 14px;
        `;

        const icon = tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : 'ℹ️';
        toast.innerHTML = `
            <span style="font-size: 18px;">${icon}</span>
            <span>${mensagem}</span>
        `;

        document.body.appendChild(toast);

        if (!document.querySelector('#toast-animation-style')) {
            const style = document.createElement('style');
            style.id = 'toast-animation-style';
            style.textContent = `
                @keyframes toastSlideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes toastSlideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'toastSlideOut 0.3s ease-out';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        }, 5000);
    };

    function formatarMoeda(valor) {
        return `R$ ${valor.toFixed(2).replace('.', ',')}`;
    }

    function gerarComprovante() {
        console.log('Gerando comprovante...');
        
        if (!orcamentoAtual) {
            mostrarToast('Calcule o orçamento primeiro!', 'error');
            return;
        }

        // Sempre gerar um novo número de pedido
        numeroPedidoGerado = 'NG' + Date.now().toString().slice(-6);
        orcamentoAtual.numeroPedido = numeroPedidoGerado;

        // Preencher o modal do comprovante
        preencherComprovanteModal();

        // Fechar o modal do orçamento
        const orcamentoModal = document.getElementById('orcamento-modal');
        if (orcamentoModal) {
            orcamentoModal.style.display = 'none';
            console.log('Modal de orçamento fechado');
        }

        // Mostrar o modal do comprovante
        const comprovanteModal = document.getElementById('comprovante-modal');
        if (comprovanteModal) {
            comprovanteModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            console.log('Modal do comprovante aberto');
            
            // Focar no modal do comprovante
            setTimeout(() => {
                comprovanteModal.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        } else {
            console.error('Modal do comprovante não encontrado!');
            mostrarToast('Erro: modal do comprovante não encontrado!', 'error');
            return;
        }

        mostrarToast('Comprovante gerado! Imprima e confirme no WhatsApp.', 'success');
        
        // Verificar se os dados foram preenchidos
        console.log('Dados do comprovante:', {
            numeroPedido: orcamentoAtual.numeroPedido,
            nome: orcamentoAtual.nome,
            email: orcamentoAtual.email,
            valor: orcamentoAtual.valores?.total
        });
    }

    // FUNÇÃO CORRIGIDA: Preencher modal do comprovante
    function preencherComprovanteModal() {
        console.log('Preenchendo modal do comprovante...');
        
        if (!orcamentoAtual) {
            console.error('Nenhum orçamento atual!');
            return;
        }

        // Garantir que temos um número de pedido
        if (!orcamentoAtual.numeroPedido) {
            orcamentoAtual.numeroPedido = 'NG' + Date.now().toString().slice(-6);
            numeroPedidoGerado = orcamentoAtual.numeroPedido;
        }

        // Preencher os campos do modal
        const pedidoNumero = document.getElementById('pedido-numero');
        const pedidoData = document.getElementById('pedido-data');
        const comprovanteNome = document.getElementById('comprovante-nome');
        const comprovanteTelefone = document.getElementById('comprovante-telefone');
        const comprovanteEmail = document.getElementById('comprovante-email'); // NOVO CAMPO: email
        const comprovanteCidade = document.getElementById('comprovante-cidade');
        const comprovanteEntrega = document.getElementById('comprovante-entrega');
        const comprovanteColetaCidade = document.getElementById('comprovante-coleta-cidade');
        const comprovanteColeta = document.getElementById('comprovante-coleta');
        const comprovanteDimensoes = document.getElementById('comprovante-dimensoes');
        const comprovantePeso = document.getElementById('comprovante-peso');
        const comprovanteDescricao = document.getElementById('comprovante-descricao');
        const comprovanteValor = document.getElementById('comprovante-valor');

        if (pedidoNumero) pedidoNumero.textContent = orcamentoAtual.numeroPedido;
        if (pedidoData) pedidoData.textContent = orcamentoAtual.data;
        if (comprovanteNome) comprovanteNome.textContent = orcamentoAtual.nome || 'Não informado';
        if (comprovanteTelefone) comprovanteTelefone.textContent = orcamentoAtual.telefone || 'Não informado';
        if (comprovanteEmail) comprovanteEmail.textContent = orcamentoAtual.email || 'Não informado'; // NOVO CAMPO: email
        if (comprovanteCidade) comprovanteCidade.textContent = orcamentoAtual.cidadeDestino || 'Não informado';
        if (comprovanteEntrega) comprovanteEntrega.textContent = orcamentoAtual.enderecoEntrega || 'Não informado';
        if (comprovanteColetaCidade) comprovanteColetaCidade.textContent = orcamentoAtual.localColeta || 'Não informado';
        if (comprovanteColeta) comprovanteColeta.textContent = orcamentoAtual.enderecoColeta || 'Não informado';
        if (comprovanteDimensoes) comprovanteDimensoes.textContent = orcamentoAtual.dimensoes || 'Não informado';
        if (comprovantePeso) comprovantePeso.textContent = (orcamentoAtual.peso || '0') + 'kg';
        if (comprovanteDescricao) comprovanteDescricao.textContent = orcamentoAtual.descricao || 'Não informada';
        if (comprovanteValor) comprovanteValor.textContent = formatarMoeda(orcamentoAtual.valores?.total || 0);

        console.log('Modal do comprovante preenchido com sucesso!');
    }

    function imprimirRecibo() {
        console.log('Tentando imprimir recibo...');
        
        if (!orcamentoAtual) {
            mostrarToast('Calcule o orçamento primeiro!', 'error');
            return;
        }

        // Verificar se temos dados mínimos
        if (!orcamentoAtual.nome || !orcamentoAtual.cidadeDestino || !orcamentoAtual.valores || !orcamentoAtual.valores.total) {
            mostrarToast('Dados incompletos para impressão!', 'error');
            return;
        }

        // Se não tem número de pedido, gerar um
        if (!orcamentoAtual.numeroPedido) {
            orcamentoAtual.numeroPedido = 'NG' + Date.now().toString().slice(-6);
            numeroPedidoGerado = orcamentoAtual.numeroPedido;
            console.log('Número de pedido gerado:', orcamentoAtual.numeroPedido);
        }

        const numeroPedido = orcamentoAtual.numeroPedido;
        const dataAtual = orcamentoAtual.data || new Date().toLocaleString('pt-BR');

        console.log('Imprimindo recibo para pedido:', numeroPedido);

        // Criar janela de impressão
        const printWindow = window.open('', '_blank', 'width=600,height=800,scrollbars=yes');
        
        if (!printWindow) {
            mostrarToast('Permita popups para imprimir o recibo!', 'error');
            return;
        }

        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <title>Recibo N&G EXPRESS - ${numeroPedido}</title>
    <meta charset="UTF-8">
    <style>
        @media print {
            @page { margin: 5mm !important; }
            body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                margin: 0;
                padding: 0;
            }
            .no-print { display: none !important; }
        }
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px;
            font-size: 14px;
            line-height: 1.4;
        }
        .recibo-container { 
            max-width: 500px; 
            margin: 0 auto;
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 8px;
        }
        .header { 
            text-align: center; 
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #007bff;
        }
        .header h2 { 
            margin: 0 0 10px 0;
            color: #007bff;
        }
        .section { 
            margin: 15px 0;
            padding: 10px;
            border-left: 3px solid #28a745;
            background: #f8fff9;
        }
        .section h4 {
            margin: 0 0 10px 0;
            color: #28a745;
        }
        .total-box { 
            text-align: center; 
            margin: 20px 0; 
            padding: 20px; 
            border: 2px solid #28a745; 
            background: #f8f9fa; 
            border-radius: 8px;
        }
        .total-amount { 
            font-size: 28px; 
            font-weight: bold; 
            color: #28a745; 
            margin: 10px 0; 
        }
        .no-print { 
            text-align: center; 
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px dashed #ccc;
        }
        .no-print button {
            padding: 10px 20px; 
            background: #007bff; 
            color: white; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer;
            margin: 5px;
            font-size: 14px;
        }
        .no-print button:hover {
            background: #0056b3;
        }
        .separator {
            border-top: 1px dashed #ccc;
            margin: 15px 0;
        }
        strong {
            color: #333;
        }
    </style>
</head>
<body>
    <div class="recibo-container">
        <div class="header">
            <h2>🚚 N&G EXPRESS 🚚</h2>
            <div><strong>Pedido:</strong> ${numeroPedido}</div>
            <div><strong>Data:</strong> ${dataAtual}</div>
            <div class="separator"></div>
        </div>
        
        <div class="section">
            <h4>Cliente</h4>
            <div><strong>Nome:</strong> ${orcamentoAtual.nome || 'Não informado'}</div>
            <div><strong>Telefone:</strong> ${orcamentoAtual.telefone || 'Não informado'}</div>
            <div><strong>Email:</strong> ${orcamentoAtual.email || 'Não informado'}</div>
        </div>
        
        <div class="section">
            <h4>COLETA</h4>
            <div><strong>Local:</strong> ${orcamentoAtual.localColeta || 'Não informado'}</div>
            ${orcamentoAtual.bairroColeta ? `<div><strong>Bairro:</strong> ${orcamentoAtual.bairroColeta}</div>` : ''}
            <div><strong>Endereço:</strong> ${orcamentoAtual.enderecoColeta || 'Não informado'}</div>
        </div>
        
        <div class="section">
            <h4>ENTREGA</h4>
            <div><strong>Cidade:</strong> ${orcamentoAtual.cidadeDestino || 'Não informado'}</div>
            ${orcamentoAtual.bairroEntrega ? `<div><strong>Bairro:</strong> ${orcamentoAtual.bairroEntrega}</div>` : ''}
            <div><strong>Endereço:</strong> ${orcamentoAtual.enderecoEntrega || 'Não informado'}</div>
        </div>
        
        <div class="section">
            <h4>ENCOMENDA</h4>
            <div><strong>Dimensões:</strong> ${orcamentoAtual.dimensoes || 'Não informado'}</div>
            <div><strong>Peso:</strong> ${orcamentoAtual.peso || '0'}kg</div>
            <div><strong>Descrição:</strong> ${orcamentoAtual.descricao || 'Não informada'}</div>
        </div>
        
        <div class="total-box">
            <h3>💰 VALOR TOTAL DA ENTREGA</h3>
            <div class="total-amount">${formatarMoeda(orcamentoAtual.valores.total)}</div>
            <div style="font-size: 12px; color: #666; margin-top: 10px;">
                Valor final para o cliente
            </div>
        </div>
        
        <div class="no-print">
            <button onclick="window.print()">
                🖨️ Imprimir Recibo
            </button>
            <button onclick="window.close()" style="background: #6c757d;">
                ✖️ Fechar
            </button>
        </div>
    </div>
    
    <script>
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
    
    // Garantir que a janela foi carregada
    printWindow.onload = function() {
        setTimeout(function() {
            try {
                printWindow.print();
            } catch (error) {
                console.error('Erro ao imprimir:', error);
                mostrarToast('Erro ao abrir impressão. Tente novamente.', 'error');
            }
        }, 500);
    };
    
    mostrarToast('Recibo gerado com sucesso!', 'success');
}

function confirmarWhatsApp() {
    console.log('Confirmando via WhatsApp...');
    
    if (!orcamentoAtual) {
        mostrarToast('Calcule o orçamento primeiro!', 'error');
        return;
    }

    // Verificar se temos dados mínimos
    if (!orcamentoAtual.nome || !orcamentoAtual.telefone || !orcamentoAtual.cidadeDestino || !orcamentoAtual.valores || !orcamentoAtual.valores.total) {
        mostrarToast('Dados incompletos para WhatsApp!', 'error');
        return;
    }

    // Se não tem número de pedido, gerar um
    if (!orcamentoAtual.numeroPedido) {
        orcamentoAtual.numeroPedido = 'NG' + Date.now().toString().slice(-6);
        numeroPedidoGerado = orcamentoAtual.numeroPedido;
        console.log('Número de pedido gerado:', orcamentoAtual.numeroPedido);
    }

    const numeroPedido = orcamentoAtual.numeroPedido;
    const dataAtual = orcamentoAtual.data || new Date().toLocaleString('pt-BR');

    // Criar mensagem do WhatsApp
    const mensagem = `*NOVO PEDIDO - N&G EXPRESS*

* PEDIDO:* ${numeroPedido}
* DATA:* ${dataAtual}

* CLIENTE:*
Nome: ${orcamentoAtual.nome}
Telefone: ${orcamentoAtual.telefone}
${orcamentoAtual.email ? `Email: ${orcamentoAtual.email}\n` : ''}
* COLETA:*
Local: ${orcamentoAtual.localColeta}
${orcamentoAtual.bairroColeta ? `Bairro: ${orcamentoAtual.bairroColeta}\n` : ''}Endereço: ${orcamentoAtual.enderecoColeta}

* ENTREGA:*
Cidade: ${orcamentoAtual.cidadeDestino}
${orcamentoAtual.bairroEntrega ? `Bairro: ${orcamentoAtual.bairroEntrega}\n` : ''}Endereço: ${orcamentoAtual.enderecoEntrega}

* ENCOMENDA:*
Dimensões: ${orcamentoAtual.dimensoes}
Peso: ${orcamentoAtual.peso}kg
Descrição: ${orcamentoAtual.descricao || 'Não informada'}

* VALOR TOTAL: ${formatarMoeda(orcamentoAtual.valores.total)}*

Por favor, confirme este pedido para iniciar a coleta.

_*Este é um pedido gerado automaticamente pelo sistema N&G EXPRESS*_`;

    const mensagemCodificada = encodeURIComponent(mensagem);
    const telefoneWhatsApp = '5547999123260';
    const whatsappUrl = `https://wa.me/${telefoneWhatsApp}?text=${mensagemCodificada}`;

    // Abrir WhatsApp em nova aba
    window.open(whatsappUrl, '_blank');
    
    mostrarToast('Abrindo WhatsApp para confirmação...', 'success');
}

    // Funções principais
    function abrirModalOrcamento() {
        const modalOrcamento = document.getElementById('orcamento-modal');
        if (!modalOrcamento) {
            console.error('Modal de orçamento não encontrado!');
            return;
        }

        modalOrcamento.style.display = 'block';
        document.body.style.overflow = 'hidden';

        const orcamentoResultado = document.getElementById('orcamento-resultado');
        const btnConfirmar = document.getElementById('btn-confirmar');

        if (orcamentoResultado) {
            orcamentoResultado.style.display = 'none';
            orcamentoResultado.innerHTML = '';
        }

        if (btnConfirmar) btnConfirmar.style.display = 'none';

        const bairroColeta = document.getElementById('bairro-coleta');
        const bairroEntrega = document.getElementById('bairro-entrega');
        if (bairroColeta) bairroColeta.innerHTML = '<option value="" disabled selected>Selecione o bairro</option>';
        if (bairroEntrega) bairroEntrega.innerHTML = '<option value="" disabled selected>Selecione o bairro</option>';

        orcamentoAtual = null;
        numeroPedidoGerado = null;

        // Habilitar campos
        habilitarCampos(true);

        // Mostrar botão calcular
        const btnCalcular = document.getElementById('btn-calcular');
        if (btnCalcular) {
            btnCalcular.style.display = 'block';
            btnCalcular.innerHTML = '<i class="bi bi-calculator"></i> Calcular Orçamento';
            btnCalcular.onclick = calcularOrcamento;
        }

        inicializarSistema();
    }

    function fecharModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }

    // NOVA FUNÇÃO: Limpar formulário completamente
    function limparFormulario() {
        console.log('Limpando formulário...');

        // Limpar todos os campos
        const form = document.getElementById('form-orcamento');
        if (form) {
            form.reset();
        }

        // Limpar selects especiais
        const bairroColeta = document.getElementById('bairro-coleta');
        const bairroEntrega = document.getElementById('bairro-entrega');
        if (bairroColeta) bairroColeta.innerHTML = '<option value="" disabled selected>Selecione o bairro</option>';
        if (bairroEntrega) bairroEntrega.innerHTML = '<option value="" disabled selected>Selecione o bairro</option>';

        // Ocultar containers
        const bairroColetaContainer = document.getElementById('bairro-coleta-container');
        const bairroEntregaContainer = document.getElementById('bairro-entrega-container');
        const enderecoDetalhadoContainer = document.getElementById('endereco-detalhado-container');

        if (bairroColetaContainer) bairroColetaContainer.style.display = 'none';
        if (bairroEntregaContainer) bairroEntregaContainer.style.display = 'none';
        if (enderecoDetalhadoContainer) enderecoDetalhadoContainer.style.display = 'none';

        // Limpar resultado
        const orcamentoResultado = document.getElementById('orcamento-resultado');
        if (orcamentoResultado) {
            orcamentoResultado.style.display = 'none';
            orcamentoResultado.innerHTML = '';
        }

        // Esconder botão confirmar
        const btnConfirmar = document.getElementById('btn-confirmar');
        if (btnConfirmar) btnConfirmar.style.display = 'none';

        // Mostrar botão calcular
        const btnCalcular = document.getElementById('btn-calcular');
        if (btnCalcular) {
            btnCalcular.style.display = 'block';
            btnCalcular.innerHTML = '<i class="bi bi-calculator"></i> Calcular Orçamento';
            btnCalcular.onclick = calcularOrcamento;
        }

        // Habilitar campos
        habilitarCampos(true);

        // Resetar variáveis
        orcamentoAtual = null;
        numeroPedidoGerado = null;
    }

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
        btnImprimir.addEventListener('click', imprimirRecibo);
    }

    const btnWhatsapp = document.getElementById('btn-whatsapp');
    if (btnWhatsapp) {
        btnWhatsapp.addEventListener('click', confirmarWhatsApp);
    }

    // Detectar F5 ou refresh da página
    window.addEventListener('beforeunload', function () {
        console.log('Página será recarregada - limpando dados do orçamento');
        orcamentoAtual = null;
        numeroPedidoGerado = null;
    });

    // Detectar F5 (keydown F5)
    document.addEventListener('keydown', function (e) {
        if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
            console.log('F5 pressionado - limpando dados do orçamento');
            limparFormulario();
        }
    });

    // Inicializar o sistema
    setTimeout(() => {
        inicializarSistema();
    }, 100);
});