// ============================================================
//  N&G EXPRESS — script.js  (versão revisada)
//  Correções e melhorias aplicadas:
//   • PRICING_CONFIG → window.PRICING_CONFIG (escopo seguro)
//   • Login/Cadastro aguardam preenchimento antes de fechar modal
//   • verificarSessao() com fallback sessionStorage quando API falha
//   • preencherFormularioComUsuario() centralizada e sem sobrescrever edições
//   • atualizarUILogado / atualizarUIDeslogado separados (sem duplicação)
//   • calcularRotaComHere() verifica hereRouter antes de chamar
//   • mostrarToast() exposta em window (usada pelo dashboard)
//   • aplicarMascaraTelefone() cobre paste e input
//   • obterDimensoes() com guards seguros
//   • calcularOrcamento() restaura botão "Calcular" após novo pedido
//   • Banner de boas-vindas no formulário quando usuário está logado
//   • Debounce de autocomplete com cancelamento correto
//   • Erros de CORS/PositionStack tratados com mensagem amigável
//   • hereRouter.calculateRoute com verificação prévia de inicialização
//   • geocodificação em paralelo com Promise.all (mais rápido)
//   • Fechar modal com tecla ESC
//   • Menu mobile fecha ao clicar em link
//   • Swiper com guard para não inicializar duas vezes
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Sistema N&G EXPRESS iniciado!');

    // ============================================================
    //  UTILITÁRIOS GLOBAIS
    // ============================================================

    /** Atualiza o ano no footer */
    function atualizarAno() {
        const el = document.getElementById('currentYear');
        if (el) el.textContent = new Date().getFullYear();
    }

    /** Máscara de telefone — cobre input E paste */
    function aplicarMascaraTelefone() {
        const tel = document.getElementById('cliente-telefone');
        if (!tel) return;

        function mascara(valor) {
            let v = valor.replace(/\D/g, '').substring(0, 11);
            if (v.length <= 10) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            return v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        }

        tel.addEventListener('input', e => { e.target.value = mascara(e.target.value); });
        tel.addEventListener('paste', e => {
            e.preventDefault();
            const texto = (e.clipboardData || window.clipboardData).getData('text');
            e.target.value = mascara(texto);
        });
    }

    /** Formata valor em moeda BRL */
    function formatarMoeda(valor) {
        return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
    }

    /**
     * Exibe toast na tela.
     * Exposta em window para uso externo (dashboard, etc.)
     */
    function mostrarToast(msg, tipo = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icone = tipo === 'success' ? 'check-circle'
                    : tipo === 'warning' ? 'exclamation-triangle'
                    : 'exclamation-circle';

        const toast = document.createElement('div');
        toast.className = `toast toast-${tipo}`;
        toast.innerHTML = `<i class="bi bi-${icone}"></i> ${msg}`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity    = '0';
            toast.style.transition = 'opacity 0.4s';
            setTimeout(() => toast.remove(), 400);
        }, 4600);
    }
    window.mostrarToast = mostrarToast; // expõe globalmente

    // ============================================================
    //  GERENCIAMENTO DE SESSÃO / UI
    // ============================================================

    /** Atualiza a interface para usuário LOGADO */
    function atualizarUILogado(usuario) {
        document.querySelectorAll('.login-item').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.perfil-item').forEach(el => el.style.display = 'block');

        const perfilNome = document.getElementById('menu-perfil-nome');
        if (perfilNome && usuario?.nome) {
            perfilNome.textContent = usuario.nome.split(' ')[0];
        }
    }

    /** Atualiza a interface para usuário DESLOGADO */
    function atualizarUIDeslogado() {
        document.querySelectorAll('.login-item').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.perfil-item').forEach(el => el.style.display = 'none');
    }

    /**
     * Preenche os campos do formulário de pedido com os dados do usuário.
     * Só preenche campos que ainda estão vazios (não sobrescreve edições manuais).
     */
    function preencherFormularioComUsuario(usuario) {
        if (!usuario) return;

        const campos = {
            'cliente-nome':     usuario.nome,
            'cliente-email':    usuario.email,
            'cliente-telefone': usuario.telefone,
        };

        Object.entries(campos).forEach(([id, valor]) => {
            const campo = document.getElementById(id);
            if (campo && !campo.value && valor) campo.value = valor;
        });

        exibirBannerUsuario(usuario);
    }

    /** Mostra um banner discreto no topo do formulário quando logado */
    function exibirBannerUsuario(usuario) {
        const form = document.getElementById('form-orcamento');
        if (!form || document.getElementById('banner-usuario')) return;

        const banner = document.createElement('div');
        banner.id = 'banner-usuario';
        banner.style.cssText = `
            background: #e8f5e9; border: 1px solid #a5d6a7; border-radius: 10px;
            padding: 10px 16px; margin-bottom: 20px; font-size: .9rem;
            display: flex; align-items: center; gap: 10px; color: #2e7d32;`;
        banner.innerHTML = `
            <i class="bi bi-person-check-fill" style="font-size:1.2rem;"></i>
            <span>Olá, <strong>${usuario.nome?.split(' ')[0] || 'usuário'}</strong>! Seus dados foram preenchidos automaticamente.</span>
            <a href="dashboard.html" style="margin-left:auto;color:#1b5e20;font-weight:600;font-size:.85rem;white-space:nowrap;">
                <i class="bi bi-speedometer2"></i> Meu Painel
            </a>`;
        form.insertBefore(banner, form.firstChild);
    }

    /**
     * Verifica sessão do usuário:
     *  1. Tenta a API PHP
     *  2. Se falhar, usa sessionStorage como fallback
     */
    /**
     * Detecta se o servidor está apenas servindo o .php como texto
     * em vez de executá-lo (Live Server, servidor estático, file://, etc.)
     */
    function servidorNaoExecutaPHP(texto) {
        const t = texto.trimStart();
        return t.startsWith('<?php') || t.startsWith('<?');
    }

    async function verificarSessao() {
        // file:// causa "did not match the expected pattern" no Safari/WebKit
        if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
            console.warn('⚠️ Protocolo file:// — usando sessionStorage (modo dev)');
            usarSessaoLocal();
            return;
        }

        try {
            const response = await fetch('api/usuarios/verificar.php');

            // Lê sempre como texto para inspecionar antes de parsear
            const texto = await response.text();

            // Servidor não executa PHP (Live Server, extensão VSCode, etc.)
            if (servidorNaoExecutaPHP(texto)) {
                console.warn('⚠️ Servidor não executa PHP — modo desenvolvimento ativo');
                console.info('ℹ️ Use XAMPP/WAMP em http://localhost para o sistema funcionar completamente');
                window._modoDesenvolvimento = true;
                usarSessaoLocal();
                return;
            }

            if (!response.ok) {
                console.warn('⚠️ API retornou status', response.status, '— usando sessionStorage');
                usarSessaoLocal();
                return;
            }

            let data;
            try {
                data = JSON.parse(texto);
            } catch {
                console.warn('⚠️ JSON inválido da API:', texto.substring(0, 120));
                usarSessaoLocal();
                return;
            }

            if (data.logado && data.usuario) {
                sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
                atualizarUILogado(data.usuario);
                preencherFormularioComUsuario(data.usuario);
            } else {
                sessionStorage.removeItem('usuario');
                atualizarUIDeslogado();
            }
        } catch (error) {
            console.warn('⚠️ Erro ao verificar sessão:', error.message);
            usarSessaoLocal();
        }
    }

    /** Fallback: usa os dados em sessionStorage quando a API não responde */
    function usarSessaoLocal() {
        const cached = sessionStorage.getItem('usuario');
        if (cached) {
            try {
                const usuario = JSON.parse(cached);
                atualizarUILogado(usuario);
                preencherFormularioComUsuario(usuario);
            } catch {
                sessionStorage.removeItem('usuario');
                atualizarUIDeslogado();
            }
        } else {
            atualizarUIDeslogado();
        }
    }

    /**
     * Parseia a resposta de uma API PHP de forma segura.
     * Lança erro descritivo se o servidor não estiver executando PHP.
     */
    async function parseRespostaAPI(response) {
        const texto = await response.text();
        if (servidorNaoExecutaPHP(texto)) {
            throw new Error('Servidor não executa PHP. Use XAMPP/WAMP em http://localhost');
        }
        try {
            return JSON.parse(texto);
        } catch {
            throw new Error('Resposta inválida do servidor: ' + texto.substring(0, 80));
        }
    }

    // ============================================================
    //  MODAIS
    // ============================================================

    window.abrirModalLogin = () => {
        const modal = document.getElementById('login-modal');
        if (modal) { modal.style.display = 'block'; document.body.style.overflow = 'hidden'; }
    };

    window.abrirModalCadastro = () => {
        window.fecharModal('login-modal');
        const modal = document.getElementById('cadastro-modal');
        if (modal) { modal.style.display = 'block'; document.body.style.overflow = 'hidden'; }
    };

    window.fecharModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) { modal.style.display = 'none'; document.body.style.overflow = 'auto'; }
    };

    // ============================================================
    //  LOGIN
    // ============================================================

    window.fazerLogin = async (event) => {
        event.preventDefault();

        const email = document.getElementById('login-email')?.value?.trim();
        const senha = document.getElementById('login-senha')?.value;

        if (!email || !senha) {
            mostrarToast('Preencha e-mail e senha', 'error');
            return;
        }

        const btn = event.target.querySelector('button[type="submit"]');
        const textoOriginal = btn?.innerHTML;
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Entrando...'; }

        try {
            const response = await fetch('api/usuarios/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await parseRespostaAPI(response);

            if (data.success && data.usuario) {
                sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
                atualizarUILogado(data.usuario);
                preencherFormularioComUsuario(data.usuario);
                window.fecharModal('login-modal');
                mostrarToast(`Bem-vindo, ${data.usuario.nome?.split(' ')[0]}!`, 'success');
            } else {
                mostrarToast(data.message || 'E-mail ou senha incorretos', 'error');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            mostrarToast(error.message.includes('PHP') ? error.message : 'Não foi possível conectar ao servidor', 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = textoOriginal; }
        }
    };

    // ============================================================
    //  CADASTRO
    // ============================================================

    window.fazerCadastro = async (event) => {
        event.preventDefault();

        const nome      = document.getElementById('cadastro-nome')?.value?.trim();
        const email     = document.getElementById('cadastro-email')?.value?.trim();
        const telefone  = document.getElementById('cadastro-telefone')?.value?.trim();
        const senha     = document.getElementById('cadastro-senha')?.value;
        const confirmar = document.getElementById('cadastro-confirmar-senha')?.value;

        if (!nome || !email || !telefone || !senha) {
            mostrarToast('Preencha todos os campos', 'error');
            return;
        }
        if (senha.length < 6) {
            mostrarToast('A senha deve ter no mínimo 6 caracteres', 'error');
            return;
        }
        if (senha !== confirmar) {
            mostrarToast('As senhas não conferem', 'error');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            mostrarToast('E-mail inválido', 'error');
            return;
        }

        const btn = event.target.querySelector('button[type="submit"]');
        const textoOriginal = btn?.innerHTML;
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Cadastrando...'; }

        try {
            const response = await fetch('api/usuarios/cadastrar.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, telefone, senha })
            });

            const data = await parseRespostaAPI(response);

            if (data.success && data.usuario) {
                sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
                atualizarUILogado(data.usuario);
                preencherFormularioComUsuario(data.usuario);
                window.fecharModal('cadastro-modal');
                mostrarToast('Cadastro realizado! Seja bem-vindo!', 'success');
            } else {
                mostrarToast(data.message || 'Erro ao cadastrar', 'error');
            }
        } catch (error) {
            console.error('Erro no cadastro:', error);
            mostrarToast(error.message.includes('PHP') ? error.message : 'Não foi possível conectar ao servidor', 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = textoOriginal; }
        }
    };

    // ============================================================
    //  LOGOUT
    // ============================================================

    window.fazerLogout = async () => {
        try {
            await fetch('api/usuarios/logout.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (e) {
            console.warn('⚠️ API de logout indisponível');
        }
        sessionStorage.removeItem('usuario');
        window.location.href = 'index.html';
    };

    // ============================================================
    //  ORÇAMENTO — VALIDAÇÃO
    // ============================================================

    function validarFormulario() {
        const obrigatorios = [
            { id: 'cliente-nome',     label: 'Nome completo' },
            { id: 'cliente-telefone', label: 'Telefone' },
            { id: 'cliente-email',    label: 'E-mail' },
            { id: 'endereco-coleta',  label: 'Endereço de coleta' },
            { id: 'endereco-entrega', label: 'Endereço de entrega' },
        ];

        for (const { id, label } of obrigatorios) {
            const campo = document.getElementById(id);
            if (!campo) continue;
            if (!campo.value?.trim()) {
                mostrarToast(`Preencha o campo: ${label}`, 'error');
                campo.focus();
                campo.style.borderColor = '#dc3545';
                campo.addEventListener('input', () => campo.style.borderColor = '', { once: true });
                return false;
            }
        }

        const email = document.getElementById('cliente-email')?.value;
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            mostrarToast('E-mail inválido', 'error');
            document.getElementById('cliente-email')?.focus();
            return false;
        }

        const coleta  = document.getElementById('endereco-coleta')?.value?.trim();
        const entrega = document.getElementById('endereco-entrega')?.value?.trim();
        if (coleta && entrega && coleta.toLowerCase() === entrega.toLowerCase()) {
            mostrarToast('Os endereços de coleta e entrega não podem ser iguais', 'warning');
            return false;
        }

        return true;
    }

    // ============================================================
    //  ORÇAMENTO — DIMENSÕES
    // ============================================================

    function obterDimensoes() {
        const ids  = ['comprimento', 'largura', 'altura', 'peso'];
        const vals = ids.map(id => {
            const el = document.getElementById(id);
            return el ? parseFloat(el.value) : NaN;
        });

        if (vals.every(v => !isNaN(v) && v > 0)) {
            return { comprimento: vals[0], largura: vals[1], altura: vals[2], peso: vals[3] };
        }
        return null;
    }

    // ============================================================
    //  ORÇAMENTO — CÁLCULO DE PREÇO
    // ============================================================

    function calcularPreco(distanciaKm, tipoVeiculo, dimensoes = null) {
        const config = window.PRICING_CONFIG;
        if (!config) return tipoVeiculo === 'moto' ? 15.00 : 50.00;

        distanciaKm = Math.round(distanciaKm * 10) / 10;

        let preco = distanciaKm <= config.limiteKmMinimo
            ? config.valorMinimoAte7km[tipoVeiculo]
            : distanciaKm * config.valorPorKm[tipoVeiculo];

        if (dimensoes) {
            const volume = dimensoes.comprimento * dimensoes.largura * dimensoes.altura;
            if (volume > config.limiteVolume) {
                preco += (volume - config.limiteVolume) * config.multiplicadorVolume;
            }
            if (dimensoes.peso > config.limitePeso) {
                preco += (dimensoes.peso - config.limitePeso) * config.multiplicadorPeso;
            }
        }

        return Math.min(Math.round(preco * 100) / 100, config.valorMaximo ?? 500);
    }

    // ============================================================
    //  ORÇAMENTO — CALCULAR (botão principal)
    // ============================================================

    /** Limpa o endereço longo do Nominatim, mantendo só rua, número e cidade */
    function limparEndereco(enderecoCompleto) {
        if (!enderecoCompleto) return enderecoCompleto;
        // Remove tudo após a 3ª vírgula (remove estado, CEP, país, regiões)
        const partes = enderecoCompleto.split(',').map(p => p.trim());
        // Pega: rua, número (se houver), bairro, cidade — no máximo 4 partes
        return partes.slice(0, 4).join(', ');
    }

    /** Monta endereço completo combinando campo de endereço + número + complemento */
    function montarEndereco(campoId, numeroId) {
        const endereco     = document.getElementById(campoId)?.value?.trim() || '';
        const numero       = document.getElementById(numeroId)?.value?.trim() || '';
        const compId       = campoId === 'endereco-coleta' ? 'complemento-coleta' : 'complemento-entrega';
        const complemento  = document.getElementById(compId)?.value?.trim() || '';

        let resultado = endereco;

        // Insere número se fornecido e não estiver já no endereço
        if (numero && !endereco.match(/,\s*\d+/)) {
            const primeiraVirgula = endereco.indexOf(',');
            if (primeiraVirgula > -1) {
                resultado = endereco.slice(0, primeiraVirgula) + ', ' + numero + endereco.slice(primeiraVirgula);
            } else {
                resultado = endereco + ', ' + numero;
            }
        }

        // Adiciona complemento se preenchido
        if (complemento) {
            resultado += ' - ' + complemento;
        }

        return resultado;
    }

    window.calcularOrcamento = async function () {
        if (!validarFormulario()) return;

        const btn = document.getElementById('btn-calcular');
        if (!btn) return;

        // Garante que o botão está visível (para recálculo)
        btn.style.display = '';

        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Calculando distância...';
        btn.disabled  = true;

        // Oculta resultado anterior
        const resultado    = document.getElementById('orcamento-resultado');
        const distanciaInfo = document.getElementById('distancia-info');
        const btnConfirmar  = document.getElementById('btn-confirmar');
        if (resultado)     resultado.style.display     = 'none';
        if (distanciaInfo) distanciaInfo.style.display = 'none';
        if (btnConfirmar)  btnConfirmar.style.display  = 'none';

        try {
            const origem  = document.getElementById('endereco-coleta')?.value?.trim();
            const destino = document.getElementById('endereco-entrega')?.value?.trim();
            // Endereços com número para exibição (geocodificação usa o endereço base)
            const origemComNumero  = montarEndereco('endereco-coleta', 'numero-coleta');
            const destinoComNumero = montarEndereco('endereco-entrega', 'numero-entrega');

            const veiculoRadio = document.querySelector('input[name="tipo-veiculo"]:checked');
            if (!veiculoRadio) throw new Error('Selecione um tipo de veículo');

            const veiculo = veiculoRadio.value;

            if (typeof window.calcularDistanciaCombinado === 'function') {
                window.distanciaAtual = await window.calcularDistanciaCombinado(origem, destino);
            } else {
                console.warn('⚠️ calcularDistanciaCombinado indisponível — usando simulação');
                window.distanciaAtual = { distanciaKm: 5.5, distanciaTexto: '5.5 km', duracaoTexto: '15 min' };
            }

            const dimensoes = obterDimensoes();
            const preco     = calcularPreco(window.distanciaAtual.distanciaKm, veiculo, dimensoes);

            // Exibe distância e duração
            const dtexto   = document.getElementById('distancia-texto');
            const dduracao = document.getElementById('duracao-texto');
            if (dtexto)    dtexto.textContent    = window.distanciaAtual.distanciaTexto;
            if (dduracao)  dduracao.textContent   = window.distanciaAtual.duracaoTexto;
            if (distanciaInfo) distanciaInfo.style.display = 'block';

            // Monta objeto do orçamento
            window.orcamentoAtual = {
                numeroPedido:    'NG' + Date.now().toString().slice(-6),
                data:            new Date().toLocaleString('pt-BR'),
                nome:            document.getElementById('cliente-nome')?.value     || '',
                telefone:        document.getElementById('cliente-telefone')?.value || '',
                email:           document.getElementById('cliente-email')?.value    || '',
                tipoVeiculo:     veiculo,
                enderecoColeta:  origemComNumero,
                enderecoEntrega: destinoComNumero,
                distancia:       window.distanciaAtual.distanciaTexto,
                distanciaNum:    window.distanciaAtual.distanciaKm,
                duracao:         window.distanciaAtual.duracaoTexto,
                dimensoes:       dimensoes
                    ? `${dimensoes.comprimento}x${dimensoes.largura}x${dimensoes.altura}cm, ${dimensoes.peso}kg`
                    : 'Não informado',
                descricao:       document.getElementById('descricao')?.value || 'Não informada',
                preco,
            };

            const totalValor = document.getElementById('total-valor');
            if (totalValor)  totalValor.textContent = formatarMoeda(preco);
            if (resultado)   resultado.style.display = 'block';

            btn.style.display = 'none';
            if (btnConfirmar) btnConfirmar.style.display = 'block';

            mostrarToast('Orçamento calculado com sucesso!', 'success');

        } catch (error) {
            console.error('Erro no cálculo:', error);
            mostrarToast(`Erro: ${error.message}`, 'error');
            btn.style.display = ''; // restaura visibilidade em caso de erro
        } finally {
            btn.innerHTML = originalHTML;
            btn.disabled  = false;
        }
    };

    // ============================================================
    //  ORÇAMENTO — ENVIAR VIA WHATSAPP
    // ============================================================

    window.enviarPedidoWhatsApp = async function () {
        if (!window.orcamentoAtual) return;

        const o = window.orcamentoAtual;
        const mensagem =
`🆕 *NOVO PEDIDO - N&G EXPRESS* 🆕

━━━━━━━━━━━━━━━━━━━━━
📋 *DADOS DO CLIENTE*
━━━━━━━━━━━━━━━━━━━━━
👤 *Nome:* ${o.nome}
📱 *Telefone:* ${o.telefone}
📧 *E-mail:* ${o.email}

━━━━━━━━━━━━━━━━━━━━━
🚚 *DADOS DA ENTREGA*
━━━━━━━━━━━━━━━━━━━━━
${o.tipoVeiculo === 'carro' ? '🚗' : '🏍️'} *Veículo:* ${o.tipoVeiculo === 'carro' ? 'Carro' : 'Moto'}
📏 *Distância:* ${o.distancia}
⏱️ *Tempo estimado:* ${o.duracao}
💰 *Valor:* ${formatarMoeda(o.preco)}

━━━━━━━━━━━━━━━━━━━━━
📍 *COLETA*
━━━━━━━━━━━━━━━━━━━━━
${limparEndereco(o.enderecoColeta)}

━━━━━━━━━━━━━━━━━━━━━
🎯 *ENTREGA*
━━━━━━━━━━━━━━━━━━━━━
${limparEndereco(o.enderecoEntrega)}

━━━━━━━━━━━━━━━━━━━━━
📦 *ENCOMENDA*
━━━━━━━━━━━━━━━━━━━━━
📐 *Dimensões:* ${o.dimensoes}
📝 *Descrição:* ${o.descricao}

🔖 *Pedido:* #${o.numeroPedido}
📅 *Data:* ${o.data}

✅ *Por favor, confirme este pedido.*`;

        // ⚠️ IMPORTANTE: abrir o WhatsApp ANTES de qualquer await
        // Browsers bloqueiam window.open() se chamado após operações assíncronas
        const whatsappURL = `https://wa.me/5547999123260?text=${encodeURIComponent(mensagem)}`;
        window.open(whatsappURL, '_blank');

        // Salva no histórico ANTES de redirecionar (aguarda a resposta)
        // O redirect só acontece após o save completar (ou falhar)
        if (sessionStorage.getItem('usuario')) {
            try {
                const saveResp = await fetch('api/orcamentos/salvar.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        numero_pedido:    o.numeroPedido,
                        tipo_veiculo:     o.tipoVeiculo,
                        endereco_coleta:  o.enderecoColeta,
                        endereco_entrega: o.enderecoEntrega,
                        dimensoes:        o.dimensoes,
                        peso:             parseFloat(o.peso) || 0,
                        descricao:        o.descricao,
                        valor_total:      o.preco,
                    }),
                });
                const saveData = await saveResp.text();
                console.log('✅ Resposta do salvar.php:', saveData.substring(0, 100));
            } catch (e) {
                console.warn('⚠️ Não foi possível salvar no histórico:', e.message);
            }
        }

        // Redireciona após o save (dá 500ms extras de margem)
        setTimeout(() => { window.location.href = 'index.html'; }, 500);
    };

    // ============================================================
    //  VARIÁVEIS DE ESTADO
    // ============================================================

    window.orcamentoAtual   = null;
    window.distanciaAtual   = null;
    window.coordenadasCache = {};

    let herePlatform = null;
    let hereRouter   = null;

    // ============================================================
    //  POSITIONSTACK — AUTOCOMPLETE
    // ============================================================

    let debounceTimer = null;

    function inicializarAutocomplete() {
        const campoColeta  = document.getElementById('endereco-coleta');
        const campoEntrega = document.getElementById('endereco-entrega');
        if (!campoColeta || !campoEntrega) return;
        if (typeof jQuery === 'undefined' || !jQuery.fn.autocomplete) return;

        const opcoes = {
            minLength: 3,
            delay: 0,
            source(req, resp) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => buscarSugestoesNominatim(req.term, resp), 500);
            },
            select(event, ui) {
                const { latitude, longitude, label } = ui.item;
                if (latitude && longitude) {
                    window.coordenadasCache[`geocode_${label}`] = { lat: latitude, lng: longitude };
                }
            },
        };

        $(campoColeta).autocomplete(opcoes);
        $(campoEntrega).autocomplete(opcoes);
    }

    async function buscarSugestoesNominatim(query, callback) {
        try {
            // Nominatim — OpenStreetMap, gratuito e sem limite de cadastro.
            // Requisito: User-Agent identificado e debounce >= 300ms (respeitado acima).
            const url = `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(query)}&format=json&addressdetails=1` +
                `&countrycodes=br&limit=6&accept-language=pt-BR`;

            const response = await fetch(url, {
                headers: { 'User-Agent': 'NGExpress/1.0 (ngexpress@email.com)' }
            });
            if (!response.ok) throw new Error(`Status ${response.status}`);
            const data = await response.json();

            callback(data.map(item => ({
                label: item.display_name,
                value: item.display_name,
                latitude:  parseFloat(item.lat),
                longitude: parseFloat(item.lon),
            })));
        } catch (error) {
            console.warn('⚠️ Autocomplete Nominatim:', error.message);
            callback([]);
        }
    }

    async function geocodificarComNominatim(endereco) {
        const cacheKey = `geocode_${endereco}`;
        if (window.coordenadasCache[cacheKey]) return window.coordenadasCache[cacheKey];

        const url = `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(endereco)}&format=json&countrycodes=br&limit=1`;

        const response = await fetch(url, {
            headers: { 'User-Agent': 'NGExpress/1.0 (ngexpress@email.com)' }
        });

        if (!response.ok) throw new Error(`Geocodificação falhou (HTTP ${response.status})`);

        const data = await response.json();
        if (!data.length) throw new Error(`Endereço não encontrado: "${endereco}"`);

        const resultado = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        window.coordenadasCache[cacheKey] = resultado;
        return resultado;
    }

    // ============================================================
    //  HERE MAPS — ROTAS
    // ============================================================

    function inicializarHereMaps() {
        try {
            if (typeof H !== 'undefined' && window.HERE_API_CONFIG?.apiKey) {
                herePlatform = new H.service.Platform({ apikey: window.HERE_API_CONFIG.apiKey });
                hereRouter   = herePlatform.getRoutingService(null, 8);
                console.log('✅ HERE Maps inicializado!');
            } else {
                console.warn('⚠️ HERE Maps SDK ou HERE_API_CONFIG não disponíveis');
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar HERE Maps:', error);
        }
    }

    async function calcularRotaComHere(origemCoords, destinoCoords) {
        if (!hereRouter) {
            throw new Error('HERE Maps não está inicializado. Verifique os scripts no HTML.');
        }

        return new Promise((resolve, reject) => {
            hereRouter.calculateRoute(
                {
                    transportMode: 'car',
                    origin:      `${origemCoords.lat},${origemCoords.lng}`,
                    destination: `${destinoCoords.lat},${destinoCoords.lng}`,
                    return:      'summary',
                },
                (result) => {
                    const section = result.routes?.[0]?.sections?.[0];
                    if (!section) { reject(new Error('Nenhuma rota encontrada')); return; }
                    const km      = (section.summary.length / 1000).toFixed(1);
                    const minutos = Math.round(section.summary.duration / 60);
                    resolve({
                        distanciaKm:    parseFloat(km),
                        distanciaTexto: `${km} km`,
                        duracaoTexto:   minutos < 60
                            ? `${minutos} min`
                            : `${Math.floor(minutos / 60)}h ${minutos % 60}min`,
                    });
                },
                (error) => reject(new Error('Erro HERE Maps: ' + (error.message || 'desconhecido')))
            );
        });
    }

    // ============================================================
    //  FUNÇÃO PRINCIPAL DE CÁLCULO (geocodifica em paralelo)
    // ============================================================

    window.calcularDistanciaCombinado = async function (origem, destino) {
        console.log('📍 Geocodificando endereços via Nominatim (OSM)...');
        const [origemCoords, destinoCoords] = await Promise.all([
            geocodificarComNominatim(origem),
            geocodificarComNominatim(destino),
        ]);
        console.log('📍 Coordenadas:', { origemCoords, destinoCoords });
        console.log('🗺️ Calculando rota HERE Maps...');
        return await calcularRotaComHere(origemCoords, destinoCoords);
    };

    // ============================================================
    //  INICIALIZAÇÃO DO HERE MAPS COM RETRY
    // ============================================================

    function aguardarHereMaps(tentativas = 0) {
        if (typeof H !== 'undefined') {
            inicializarHereMaps();
        } else if (tentativas < 10) {
            setTimeout(() => aguardarHereMaps(tentativas + 1), 300);
        } else {
            console.warn('⚠️ HERE Maps não carregou após 3s. Verifique os scripts no HTML.');
        }
    }

    // ============================================================
    //  SWIPER
    // ============================================================

    function inicializarSwiper() {
        const swiperEl = document.querySelector('.hero-swiper');
        if (!swiperEl || typeof Swiper === 'undefined') return;
        if (swiperEl.swiper) return; // já inicializado, não duplica

        new Swiper('.hero-swiper', {
            loop:       true,
            autoplay:   { delay: 5000, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true },
            speed:      1000,
            effect:     'fade',
            fadeEffect: { crossFade: true },
        });
    }

    // ============================================================
    //  SMOOTH SCROLL
    // ============================================================

    function inicializarSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (!targetId || targetId === '#' || targetId === '#home') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }
                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    const headerHeight = document.querySelector('header')?.offsetHeight || 0;
                    window.scrollTo({ top: target.offsetTop - headerHeight, behavior: 'smooth' });
                }
            });
        });
    }

    // ============================================================
    //  INICIALIZAÇÃO GERAL
    // ============================================================

    aguardarHereMaps();
    verificarSessao();
    aplicarMascaraTelefone();
    atualizarAno();
    inicializarAutocomplete();
    inicializarSwiper();
    inicializarSmoothScroll();

    // Header com sombra ao scrollar
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 50));
    }

    // Botão "Voltar ao topo"
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            backToTop.style.display = window.pageYOffset > 300 ? 'flex' : 'none';
        });
        backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // Menu mobile
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks      = document.querySelector('.nav-links');
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => navLinks.classList.toggle('active'));
        // Fecha menu ao clicar em qualquer link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('active'));
        });
    }

    // Event listeners do formulário de orçamento
    document.getElementById('btn-calcular')?.addEventListener('click', window.calcularOrcamento);
    document.getElementById('btn-confirmar')?.addEventListener('click', window.enviarPedidoWhatsApp);

    // Fechar modal ao clicar no backdrop
    window.addEventListener('click', (e) => {
        if (e.target.classList?.contains('modal')) window.fecharModal(e.target.id);
    });

    // Fechar modal com tecla ESC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(m => {
                if (m.style.display === 'block') window.fecharModal(m.id);
            });
        }
    });
});