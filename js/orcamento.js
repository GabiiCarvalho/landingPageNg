// Sistema de orçamento - VERSÃO CORRIGIDA E FUNCIONAL
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

    // CORREÇÃO: Calcular valor base com as novas regras (Camboriú → Camboriú: 15 + 30)
    function calcularValorBase(localColetaId, cidadeDestinoId, bairroColetaInfo, bairroEntregaInfo) {
        let valorBase = 0;
        let adicionalBairro = 0;
        let isBairroEspecial = false;
        let tipoBairroEspecial = '';

        console.log('Calculando valores:');
        console.log('Coleta:', localColetaId, 'Bairro coleta:', bairroColetaInfo);
        console.log('Entrega:', cidadeDestinoId, 'Bairro entrega:', bairroEntregaInfo);

        // 1. Balneário Camboriú para Camboriú
        if (localColetaId === 'balneario-camboriu' && cidadeDestinoId === 'camboriu') {
            valorBase = 20;
            if (bairroEntregaInfo.tipoBairro === 'especial') {
                adicionalBairro = 35; // CORRIGIDO: 30 para 35
                isBairroEspecial = true;
                tipoBairroEspecial = 'camboriu';
            }
        }
        // 2. Balneário Camboriú para Itajaí
        else if (localColetaId === 'balneario-camboriu' && cidadeDestinoId === 'itajai') {
            valorBase = 30;
            if (bairroEntregaInfo.tipoBairro === 'especial') {
                adicionalBairro = 20;
                isBairroEspecial = true;
                tipoBairroEspecial = 'itajai';
            }
        }
        // 3. Camboriú para Camboriú - CORREÇÃO AQUI
        else if (localColetaId === 'camboriu' && cidadeDestinoId === 'camboriu') {
            valorBase = 15; // Base sempre 15 para Camboriú → Camboriú

            // Se o bairro de entrega é especial, adiciona R$ 30
            if (bairroEntregaInfo.tipoBairro === 'especial') {
                adicionalBairro = 30; // CORREÇÃO: 20 para 30
                isBairroEspecial = true;
                tipoBairroEspecial = 'camboriu';
            }
        }
        // 4. Camboriú para Itajaí
        else if (localColetaId === 'camboriu' && cidadeDestinoId === 'itajai') {
            valorBase = 30;
            if (bairroEntregaInfo.tipoBairro === 'especial') {
                adicionalBairro = 20;
                isBairroEspecial = true;
                tipoBairroEspecial = 'itajai';
            }
        }
        // 5. Itajaí para Itajaí
        else if (localColetaId === 'itajai' && cidadeDestinoId === 'itajai') {
            valorBase = 30;
            if (bairroEntregaInfo.tipoBairro === 'especial') {
                adicionalBairro = 20;
                isBairroEspecial = true;
                tipoBairroEspecial = 'itajai';
            }
        }
        // 6. Itajaí para Camboriú
        else if (localColetaId === 'itajai' && cidadeDestinoId === 'camboriu') {
            valorBase = 30;
            if (bairroEntregaInfo.tipoBairro === 'especial') {
                adicionalBairro = 35;
                isBairroEspecial = true;
                tipoBairroEspecial = 'camboriu';
            }
        }
        // 7. Outras cidades
        else {
            // Usar valor da tabela de preços
            valorBase = TABELA_PRECOS[cidadeDestinoId] ? TABELA_PRECOS[cidadeDestinoId].min : 0;

            // Verificar se é bairro especial de Camboriú
            if (cidadeDestinoId === 'camboriu' && bairroEntregaInfo.tipoBairro === 'especial') {
                adicionalBairro = 35;
                isBairroEspecial = true;
                tipoBairroEspecial = 'camboriu';
            }

            // Verificar se é bairro especial de Itajaí
            if (cidadeDestinoId === 'itajai' && bairroEntregaInfo.tipoBairro === 'especial') {
                adicionalBairro = 20;
                isBairroEspecial = true;
                tipoBairroEspecial = 'itajai';
                valorBase = 30;
            }
        }

        console.log('Resultado cálculo:', { valorBase, adicionalBairro, isBairroEspecial, tipoBairroEspecial });
        return { valorBase, adicionalBairro, isBairroEspecial, tipoBairroEspecial };
    }

    // FUNÇÃO CORRIGIDA: calcularOrcamento
    function calcularOrcamento() {
        console.log('Iniciando cálculo do orçamento...');

        // Validar formulário
        if (!validarFormulario()) {
            console.log('Formulário inválido');
            return;
        }

        // Coletar dados do formulário
        const localColetaId = document.getElementById('local-coleta').value;
        const localColetaNome = document.getElementById('local-coleta').options[document.getElementById('local-coleta').selectedIndex].text;
        const cidadeDestinoId = document.getElementById('cidade-destino').value;
        const cidadeDestinoNome = document.getElementById('cidade-destino').options[document.getElementById('cidade-destino').selectedIndex].text;

        // Obter informações dos bairros
        const bairroColetaInfo = obterValorBairroSelecionado('bairro-coleta', localColetaId);
        const bairroEntregaInfo = obterValorBairroSelecionado('bairro-entrega', cidadeDestinoId);

        // Coletar dimensões
        const comprimento = parseFloat(document.getElementById('comprimento').value) || 0;
        const largura = parseFloat(document.getElementById('largura').value) || 0;
        const altura = parseFloat(document.getElementById('altura').value) || 0;
        const peso = parseFloat(document.getElementById('peso').value) || 0;

        console.log('Dados coletados:', {
            localColetaId, cidadeDestinoId, comprimento, largura, altura, peso,
            bairroColetaInfo, bairroEntregaInfo
        });

        // Calcular valor base
        const { valorBase, adicionalBairro, isBairroEspecial, tipoBairroEspecial } =
            calcularValorBase(localColetaId, cidadeDestinoId, bairroColetaInfo, bairroEntregaInfo);

        // Calcular volume
        const volumeCm3 = comprimento * largura * altura;
        const volumeLitros = volumeCm3 / 1000;

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

        // Obter valor máximo da tabela
        const cidadeInfo = TABELA_PRECOS[cidadeDestinoId];
        const valorMaximo = cidadeInfo ? cidadeInfo.max : 999;

        // Calcular total
        const total = valorBase + adicionalTamanho + adicionalPeso + adicionalBairro;
        const totalFinal = Math.min(total, valorMaximo);

        console.log('Cálculos finais:', {
            valorBase, adicionalTamanho, adicionalPeso, adicionalBairro,
            total, totalFinal, valorMaximo
        });

        // Salvar orçamento atual
        orcamentoAtual = {
            nome: document.getElementById('cliente-nome').value,
            telefone: document.getElementById('cliente-telefone').value,
            localColeta: localColetaNome,
            localColetaId: localColetaId,
            enderecoColeta: document.getElementById('endereco-detalhado').value,
            bairroColeta: bairroColetaInfo.nomeBairro,
            cidadeDestino: cidadeDestinoNome,
            cidadeDestinoId: cidadeDestinoId,
            enderecoEntrega: document.getElementById('entrega-endereco').value,
            bairroEntrega: bairroEntregaInfo.nomeBairro,
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
            tipoBairroColeta: bairroColetaInfo.tipoBairro,
            data: new Date().toLocaleString('pt-BR'),
            timestamp: Date.now()
        };

        // Exibir resultado
        exibirResultadoOrcamento(valorBase, adicionalTamanho, adicionalPeso, adicionalBairro, totalFinal, tipoBairroEspecial);

        // Mostrar toast de sucesso
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

    // FUNÇÃO CORRIGIDA: exibirResultadoOrcamento
    function exibirResultadoOrcamento(valorBase, adicionalTamanho, adicionalPeso, adicionalBairro, totalFinal, tipoBairroEspecial) {
        // Criar elemento de valores detalhados se não existir
        let valoresDetalhes = document.querySelector('.valores-detalhes');
        if (!valoresDetalhes) {
            valoresDetalhes = document.createElement('div');
            valoresDetalhes.className = 'valores-detalhes';
            const orcamentoResultado = document.getElementById('orcamento-resultado');
            if (orcamentoResultado) {
                const resultadoContent = orcamentoResultado.querySelector('.resultado-content');
                if (resultadoContent) {
                    resultadoContent.appendChild(valoresDetalhes);
                }
            }
        }

        // Limpar valores anteriores
        valoresDetalhes.innerHTML = '';

        // Criar estrutura de valores
        const valorBaseHTML = `
            <div class="resultado-item">
                <span>Valor Base:</span>
                <span>${formatarMoeda(valorBase)}</span>
            </div>
        `;
        valoresDetalhes.innerHTML = valorBaseHTML;

        // Adicionar adicionais se houver
        if (adicionalTamanho > 0) {
            const tamanhoItem = document.createElement('div');
            tamanhoItem.className = 'resultado-item';
            tamanhoItem.innerHTML = `
                <span>Adicional Tamanho:</span>
                <span>${formatarMoeda(adicionalTamanho)}</span>
            `;
            valoresDetalhes.appendChild(tamanhoItem);
        }

        if (adicionalPeso > 0) {
            const pesoItem = document.createElement('div');
            pesoItem.className = 'resultado-item';
            pesoItem.innerHTML = `
                <span>Adicional Peso:</span>
                <span>${formatarMoeda(adicionalPeso)}</span>
            `;
            valoresDetalhes.appendChild(pesoItem);
        }

        if (adicionalBairro > 0) {
            const bairroItem = document.createElement('div');
            bairroItem.className = 'resultado-item';
            const label = tipoBairroEspecial === 'itajai' ? 'Adicional Bairro (Itajaí):' : 'Adicional Bairro (Camboriú):';
            bairroItem.innerHTML = `
                <span>${label}</span>
                <span>${formatarMoeda(adicionalBairro)}</span>
            `;
            valoresDetalhes.appendChild(bairroItem);
        }

        // Adicionar total
        const totalItem = document.createElement('div');
        totalItem.className = 'resultado-item total';
        totalItem.innerHTML = `
            <span><strong>VALOR TOTAL:</strong></span>
            <span id="total-valor"><strong>${formatarMoeda(totalFinal)}</strong></span>
        `;
        valoresDetalhes.appendChild(totalItem);

        // Mostrar resultados
        const orcamentoResultado = document.getElementById('orcamento-resultado');
        const btnConfirmar = document.getElementById('btn-confirmar');

        if (orcamentoResultado) {
            orcamentoResultado.style.display = 'block';
            // Scroll para resultado
            setTimeout(() => {
                orcamentoResultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }

        if (btnConfirmar) {
            btnConfirmar.style.display = 'block';
        }
    }

    // FUNÇÃO CORRIGIDA: validarFormulario
    function validarFormulario() {
        console.log('Validando formulário...');

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

        // Validação de bairro para cidades que têm bairros
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

        // Validação de telefone
        const telefone = document.getElementById('cliente-telefone').value;
        const telefoneDigits = telefone.replace(/\D/g, '');
        if (telefoneDigits.length < 10) {
            mostrarToast('Telefone deve ter pelo menos 10 dígitos!', 'error');
            document.getElementById('cliente-telefone').style.borderColor = '#dc3545';
            document.getElementById('cliente-telefone').focus();
            return false;
        }

        // Validações de dimensões
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

        // Remover toasts antigos
        const oldToasts = document.querySelectorAll('.custom-toast');
        oldToasts.forEach(toast => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });

        // Criar toast
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

        // Adicionar animação CSS se não existir
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

        // Remover após 5 segundos
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
        if (!orcamentoAtual) {
            mostrarToast('Calcule o orçamento primeiro!', 'error');
            return;
        }

        // Gerar número de pedido
        numeroPedidoGerado = 'NG' + Date.now().toString().slice(-6);
        orcamentoAtual.numeroPedido = numeroPedidoGerado;

        // CORREÇÃO: Preencher os dados do comprovante antes de abrir o modal
        preencherComprovanteModal();

        // Fechar modal de orçamento e abrir comprovante
        fecharModal();
        const comprovanteModal = document.getElementById('comprovante-modal');
        if (comprovanteModal) {
            comprovanteModal.style.display = 'block';
        }

        mostrarToast('Comprovante gerado! Imprima e confirme no WhatsApp.', 'success');
    }

    // NOVA FUNÇÃO: Preencher modal do comprovante
    function preencherComprovanteModal() {
        if (!orcamentoAtual || !orcamentoAtual.numeroPedido) return;

        const comprovanteContent = document.getElementById('comprovante-content');
        if (!comprovanteContent) return;

        // Criar conteúdo do comprovante
        const content = `
            <div class="comprovante-preview">
                <div class="header">
                    <h3>🚚 N&G EXPRESS 🚚</h3>
                    <div><strong>Pedido:</strong> ${orcamentoAtual.numeroPedido}</div>
                    <div><strong>Data:</strong> ${orcamentoAtual.data}</div>
                </div>
                
                <div class="section">
                    <h4>Cliente</h4>
                    <div><strong>Nome:</strong> ${orcamentoAtual.nome}</div>
                    <div><strong>Telefone:</strong> ${orcamentoAtual.telefone}</div>
                </div>
                
                <div class="section">
                    <h4>Coleta</h4>
                    <div><strong>Local:</strong> ${orcamentoAtual.localColeta}</div>
                    ${orcamentoAtual.bairroColeta ? `<div><strong>Bairro:</strong> ${orcamentoAtual.bairroColeta}</div>` : ''}
                    <div><strong>Endereço:</strong> ${orcamentoAtual.enderecoColeta}</div>
                </div>
                
                <div class="section">
                    <h4>Entrega</h4>
                    <div><strong>Cidade:</strong> ${orcamentoAtual.cidadeDestino}</div>
                    ${orcamentoAtual.bairroEntrega ? `<div><strong>Bairro:</strong> ${orcamentoAtual.bairroEntrega}</div>` : ''}
                    <div><strong>Endereço:</strong> ${orcamentoAtual.enderecoEntrega}</div>
                </div>
                
                <div class="section">
                    <h4>Encomenda</h4>
                    <div><strong>Dimensões:</strong> ${orcamentoAtual.dimensoes}</div>
                    <div><strong>Peso:</strong> ${orcamentoAtual.peso}kg</div>
                    <div><strong>Descrição:</strong> ${orcamentoAtual.descricao}</div>
                </div>
                
                <div class="total-section">
                    <h4>Valor Total</h4>
                    <div class="total-amount">${formatarMoeda(orcamentoAtual.valores.total)}</div>
                </div>
            </div>
        `;

        comprovanteContent.innerHTML = content;
    }


    function imprimirRecibo() {
        if (!orcamentoAtual || !orcamentoAtual.numeroPedido) {
            mostrarToast('Gere o comprovante primeiro!', 'error');
            return;
        }

        // Usar a variável global numeroPedidoGerado
        const numeroPedido = numeroPedidoGerado || orcamentoAtual.numeroPedido;

        // Criar nova janela para impressão
        const printWindow = window.open('', '_blank', 'width=600,height=800');
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
                .valores-detalhados { display: none !important; }
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
                border-top: 1px solid #ddd;
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
            .valores-detalhados {
                display: none;
            }
        </style>
    </head>
    <body>
        <div class="recibo-container">
            <div class="header">
                <h2>🚚 N&G EXPRESS 🚚</h2>
                <div><strong>Pedido:</strong> ${numeroPedido}</div>
                <div><strong>Data:</strong> ${orcamentoAtual.data}</div>
                <div class="separator"></div>
            </div>
            
            <div class="section">
                <h4>Cliente</h4>
                <div><strong>Nome:</strong> ${orcamentoAtual.nome}</div>
                <div><strong>Telefone:</strong> ${orcamentoAtual.telefone}</div>
            </div>
            
            <div class="section">
                <h4>COLETA</h4>
                <div><strong>Local:</strong> ${orcamentoAtual.localColeta}</div>
                ${orcamentoAtual.bairroColeta ? `<div><strong>Bairro:</strong> ${orcamentoAtual.bairroColeta}</div>` : ''}
                <div><strong>Endereço:</strong> ${orcamentoAtual.enderecoColeta}</div>
            </div>
            
            <div class="section">
                <h4>ENTREGA</h4>
                <div><strong>Cidade:</strong> ${orcamentoAtual.cidadeDestino}</div>
                ${orcamentoAtual.bairroEntrega ? `<div><strong>Bairro:</strong> ${orcamentoAtual.bairroEntrega}</div>` : ''}
                <div><strong>Endereço:</strong> ${orcamentoAtual.enderecoEntrega}</div>
            </div>
            
            <div class="section">
                <h4>ENCOMENDA</h4>
                <div><strong>Dimensões:</strong> ${orcamentoAtual.dimensoes}</div>
                <div><strong>Peso:</strong> ${orcamentoAtual.peso}kg</div>
                <div><strong>Descrição:</strong> ${orcamentoAtual.descricao}</div>
            </div>
            
            <div class="total-box">
                <h3>💰 VALOR TOTAL DA ENTREGA</h3>
                <div class="total-amount">${formatarMoeda(orcamentoAtual.valores.total)}</div>
                <div style="font-size: 12px; color: #666; margin-top: 10px;">
                    Valor final para o cliente
                </div>
            </div>
            
            <!-- Valores detalhados (ocultos para o cliente) -->
            <div class="valores-detalhados">
                <h4>Detalhamento Interno:</h4>
                <div>Valor base: ${formatarMoeda(orcamentoAtual.valores.base)}</div>
                ${orcamentoAtual.valores.tamanho > 0 ? `<div>Adicional tamanho: ${formatarMoeda(orcamentoAtual.valores.tamanho)}</div>` : ''}
                ${orcamentoAtual.valores.peso > 0 ? `<div>Adicional peso: ${formatarMoeda(orcamentoAtual.valores.peso)}</div>` : ''}
                ${orcamentoAtual.valores.bairro > 0 ? `<div>Adicional bairro: ${formatarMoeda(orcamentoAtual.valores.bairro)}</div>` : ''}
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
    }

    function confirmarWhatsApp() {
        if (!orcamentoAtual || !orcamentoAtual.numeroPedido) {
            mostrarToast('Gere o comprovante primeiro!', 'error');
            return;
        }

        // CORREÇÃO: Mensagem simplificada e organizada
        const mensagem = `*NOVO PEDIDO - N&G EXPRESS*

*Pedido:* ${orcamentoAtual.numeroPedido}
*Data:* ${orcamentoAtual.data}

*Cliente:*
Nome: ${orcamentoAtual.nome}
Telefone: ${orcamentoAtual.telefone}

*COLETA:*
Local: ${orcamentoAtual.localColeta}
${orcamentoAtual.bairroColeta ? `Bairro: ${orcamentoAtual.bairroColeta}\n` : ''}Endereço: ${orcamentoAtual.enderecoColeta}

*ENTREGA:*
Cidade: ${orcamentoAtual.cidadeDestino}
${orcamentoAtual.bairroEntrega ? `Bairro: ${orcamentoAtual.bairroEntrega}\n` : ''}Endereço: ${orcamentoAtual.enderecoEntrega}

*ENCOMENDA:*
Dimensões: ${orcamentoAtual.dimensoes}
Peso: ${orcamentoAtual.peso}kg
Descrição: ${orcamentoAtual.descricao}

*VALOR TOTAL: ${formatarMoeda(orcamentoAtual.valores.total)}*

Confirme este pedido para iniciar a coleta.`;

        // Codificar a mensagem para URL
        const mensagemCodificada = encodeURIComponent(mensagem);
        const telefoneWhatsApp = '5547999123260';
        const whatsappUrl = `https://wa.me/${telefoneWhatsApp}?text=${mensagemCodificada}`;

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

        // Resetar campos
        const orcamentoResultado = document.getElementById('orcamento-resultado');
        const btnConfirmar = document.getElementById('btn-confirmar');

        if (orcamentoResultado) orcamentoResultado.style.display = 'none';
        if (btnConfirmar) btnConfirmar.style.display = 'none';

        // Limpar selects de bairro
        const bairroColeta = document.getElementById('bairro-coleta');
        const bairroEntrega = document.getElementById('bairro-entrega');
        if (bairroColeta) bairroColeta.innerHTML = '<option value="" disabled selected>Selecione o bairro</option>';
        if (bairroEntrega) bairroEntrega.innerHTML = '<option value="" disabled selected>Selecione o bairro</option>';

        // Limpar variáveis globais
        orcamentoAtual = null;
        numeroPedidoGerado = null;

        // Inicializar sistema
        inicializarSistema();
    }

    function fecharModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
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

    // Inicializar o sistema
    setTimeout(() => {
        inicializarSistema();
    }, 100);
});