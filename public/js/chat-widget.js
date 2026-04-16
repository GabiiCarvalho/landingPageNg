/**
 * N&G Express — Chat Widget
 * Botão flutuante + popup de chat para clientes logados
 * 
 * COMO USAR:
 * 1. Adicione chat-session.php no <head> de todas as páginas (via include PHP)
 * 2. Adicione este script antes do </body>:
 *    <script src="js/chat-widget.js"></script>
 * 
 * O widget só aparece para usuários com sessão PHP ativa.
 */

(function () {
    'use strict';

    // ── Configuração ──────────────────────────────────────────────
    const RAILWAY_URL = 'https://chatbotng-production.up.railway.app';
    const HERE_API_KEY = 'O8E5nipilq9UhVMoh75UR3RxE0J3zvC1DCXR-DZVL6I';
    const PRICING = {
        valorMinimoAte7km: { moto: 15.00, carro: 50.00 },
        valorPorKm:        { moto: 1.80,  carro: 3.50  },
        limiteKmMinimo:    7,
        valorMaximo:       500.00
    };

    // ── Verifica sessão ───────────────────────────────────────────
    function getUsuario() {
        // Prioridade 1: PHP injetou via chat-session.php include
        if (window.__NG_USER__ && window.__NG_USER__.logado) return window.__NG_USER__;
        // Prioridade 2: sessionStorage (login via JS)
        try {
            const raw = sessionStorage.getItem('usuario');
            if (raw) { const u = JSON.parse(raw); if (u && u.id) return { logado: true, ...u }; }
        } catch (_) {}
        return null;
    }

    // ── Só inicializa se logado ───────────────────────────────────
    function init() {
        const usuario = getUsuario();
        if (!usuario) return; // Não logado → sem widget

        injetarCSS();
        criarWidget(usuario);
    }

    // ── CSS ───────────────────────────────────────────────────────
    function injetarCSS() {
        if (document.getElementById('ng-chat-css')) return;
        const s = document.createElement('style');
        s.id = 'ng-chat-css';
        s.textContent = `
/* ── Botão flutuante ── */
#ng-chat-btn {
    position: fixed; bottom: 28px; right: 28px; z-index: 9998;
    width: 60px; height: 60px; border-radius: 50%;
    background: linear-gradient(135deg, #075e54, #25d366);
    box-shadow: 0 4px 20px rgba(7,94,84,.45);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform .25s, box-shadow .25s;
    animation: ng-pop-in .4s cubic-bezier(.34,1.56,.64,1) both;
}
#ng-chat-btn:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(7,94,84,.55); }
#ng-chat-btn svg { width: 28px; height: 28px; fill: #fff; }
#ng-chat-badge {
    position: absolute; top: -2px; right: -2px;
    background: #ef5350; color: #fff; border-radius: 50%;
    width: 20px; height: 20px; font-size: 11px; font-weight: 700;
    display: none; align-items: center; justify-content: center;
    border: 2px solid #fff; font-family: sans-serif;
}
@keyframes ng-pop-in {
    from { opacity: 0; transform: scale(0) translateY(20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* ── Popup ── */
#ng-chat-popup {
    position: fixed; bottom: 100px; right: 28px; z-index: 9999;
    width: 370px; max-width: calc(100vw - 32px);
    height: 580px; max-height: calc(100vh - 120px);
    background: #fff; border-radius: 20px;
    box-shadow: 0 12px 48px rgba(0,0,0,.22);
    display: none; flex-direction: column; overflow: hidden;
    font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
    animation: ng-slide-up .3s cubic-bezier(.34,1.2,.64,1) both;
    border: 1px solid rgba(0,0,0,.08);
}
#ng-chat-popup.open { display: flex; }
@keyframes ng-slide-up {
    from { opacity: 0; transform: translateY(24px) scale(.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1);    }
}

/* ── Header do popup ── */
.ng-hd {
    background: #075e54; padding: 14px 18px;
    display: flex; align-items: center; gap: 10px; flex-shrink: 0;
}
.ng-hd-av {
    width: 38px; height: 38px; border-radius: 50%; background: #128c7e;
    display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;
}
.ng-hd-info h4 { color: #fff; font-size: .88rem; font-weight: 700; margin: 0; }
.ng-hd-info p  { color: rgba(255,255,255,.75); font-size: .66rem; margin: 2px 0 0; }
.ng-hd-close {
    margin-left: auto; background: none; border: none; color: rgba(255,255,255,.8);
    font-size: 22px; cursor: pointer; line-height: 1; padding: 4px; border-radius: 50%;
    transition: background .2s;
}
.ng-hd-close:hover { background: rgba(255,255,255,.15); }
.ng-badge-on {
    width: 8px; height: 8px; border-radius: 50%; background: #25d366;
    display: inline-block; margin-right: 4px;
}

/* ── Área de mensagens ── */
.ng-msgs {
    flex: 1; overflow-y: auto; padding: 14px 16px;
    display: flex; flex-direction: column; gap: 4px;
    background: #f0f2f5; min-height: 0;
}
.ng-msgs::-webkit-scrollbar { width: 4px; }
.ng-msgs::-webkit-scrollbar-thumb { background: rgba(0,0,0,.15); border-radius: 4px; }
.ng-msg { display: flex; flex-direction: column; animation: ng-msg-in .2s ease; }
@keyframes ng-msg-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.ng-bot { align-items: flex-start; }
.ng-usr { align-items: flex-end; }
.ng-bal {
    max-width: 80%; padding: 7px 11px; border-radius: 16px;
    font-size: .83rem; line-height: 1.5; word-break: break-word;
}
.ng-bot .ng-bal { background: #fff; color: #111b21; border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
.ng-usr .ng-bal { background: #dcf8c6; color: #111b21; border-bottom-right-radius: 4px; }
.ng-hr { font-size: .58rem; color: #667781; margin-top: 2px; padding: 0 3px; }
.ng-opts { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.ng-ob {
    background: #fff; border: 1.5px solid #075e54; color: #075e54;
    padding: 5px 14px; border-radius: 20px; font-size: .76rem; font-weight: 600;
    font-family: inherit; cursor: pointer; transition: all .2s;
}
.ng-ob:hover { background: #075e54; color: #fff; }
.ng-ob:disabled { opacity: .4; cursor: default; pointer-events: none; }

/* Typing */
.ng-typing {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 8px 12px; background: #fff; border-radius: 16px;
    border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,.1);
}
.ng-typing span {
    width: 6px; height: 6px; border-radius: 50%; background: #128c7e;
    animation: ng-blink 1.4s infinite ease-in-out;
}
.ng-typing span:nth-child(2) { animation-delay: .2s; }
.ng-typing span:nth-child(3) { animation-delay: .4s; }
@keyframes ng-blink {
    0%,60%,100% { transform: translateY(0); opacity: .4; }
    30%         { transform: translateY(-5px); opacity: 1; }
}

/* Card PIX */
.ng-pix {
    background: #fff; border-radius: 14px; padding: 14px;
    border: 2px solid #43a047; box-shadow: 0 2px 12px rgba(0,0,0,.1); width: 100%;
}
.ng-pix-v { font-size: 1.4rem; font-weight: 800; color: #1b5e20; margin: 4px 0 8px; }
.ng-pix-qr { display: flex; justify-content: center; margin-bottom: 8px; }
.ng-pix-qr img { width: 160px; height: 160px; border-radius: 8px; border: 1px solid #e0e0e0; }
.ng-pix-cod {
    background: #f1f8e9; border: 1px dashed #a5d6a7; border-radius: 6px;
    padding: 6px 8px; font-size: .58rem; color: #2e7d32;
    word-break: break-all; cursor: pointer; line-height: 1.4;
}
.ng-pix-cod:hover { background: #dcedc8; }
.ng-pix-hint { font-size: .58rem; color: #888; text-align: center; margin-top: 4px; }

/* Banner aguardando */
.ng-bpag {
    background: #e8f5e9; border: 1px solid #66bb6a; border-radius: 10px;
    padding: 10px 12px; margin: 4px 0; text-align: center; font-size: .73rem; line-height: 1.6;
}
.ng-bpag strong { color: #1b5e20; display: block; margin-bottom: 2px; font-size: .76rem; }
.ng-bpag span { color: #388e3c; }
.ng-pdots { display: inline-flex; gap: 3px; margin-top: 4px; }
.ng-pdots i {
    width: 5px; height: 5px; border-radius: 50%; background: #43a047;
    animation: ng-pdot 1.4s infinite ease-in-out;
}
.ng-pdots i:nth-child(2) { animation-delay: .2s; }
.ng-pdots i:nth-child(3) { animation-delay: .4s; }
@keyframes ng-pdot {
    0%,60%,100% { transform: scale(.6); opacity: .4; }
    30% { transform: scale(1); opacity: 1; }
}

/* ── Input ── */
.ng-ia {
    background: #e9edef; padding: 8px 10px;
    display: flex; align-items: center; gap: 6px; flex-shrink: 0;
}
.ng-campo {
    flex: 1; background: #fff; border: none; border-radius: 22px;
    padding: 8px 14px; font-size: .83rem; font-family: inherit;
    outline: none; color: #111b21; min-width: 0;
}
.ng-campo:disabled { background: #e0e0e0; color: #aaa; cursor: not-allowed; }
.ng-benv {
    width: 38px; height: 38px; border-radius: 50%; background: #075e54;
    border: none; color: #fff; cursor: pointer;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    transition: background .2s;
}
.ng-benv:hover { background: #128c7e; }
.ng-benv:disabled { background: #aaa; cursor: not-allowed; }

/* Mobile */
@media (max-width: 480px) {
    #ng-chat-popup { width: calc(100vw - 16px); right: 8px; bottom: 88px; height: calc(100vh - 110px); border-radius: 16px; }
    #ng-chat-btn { bottom: 20px; right: 16px; }
}
        `;
        document.head.appendChild(s);
    }

    // ── Cria o widget ─────────────────────────────────────────────
    function criarWidget(usuario) {
        // Botão flutuante
        const btn = document.createElement('button');
        btn.id = 'ng-chat-btn';
        btn.title = 'Chat N&G Express';
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
            <span id="ng-chat-badge"></span>
        `;

        // Popup
        const popup = document.createElement('div');
        popup.id = 'ng-chat-popup';
        popup.innerHTML = `
            <div class="ng-hd">
                <div class="ng-hd-av">🚚</div>
                <div class="ng-hd-info">
                    <h4>N&G Express</h4>
                    <p><span class="ng-badge-on"></span>Online agora</p>
                </div>
                <button class="ng-hd-close" id="ng-chat-close">✕</button>
            </div>
            <div class="ng-msgs" id="ng-msgs"></div>
            <div class="ng-ia">
                <input class="ng-campo" id="ng-campo" placeholder="Digite sua mensagem..." autocomplete="off">
                <button class="ng-benv" id="ng-benv">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(btn);
        document.body.appendChild(popup);

        btn.addEventListener('click', () => togglePopup(usuario));
        document.getElementById('ng-chat-close').addEventListener('click', fecharPopup);
        document.getElementById('ng-benv').addEventListener('click', () => enviar());
        document.getElementById('ng-campo').addEventListener('keypress', e => {
            if (e.key === 'Enter') { e.preventDefault(); enviar(); }
        });
    }

    // ── Toggle popup ──────────────────────────────────────────────
    let inicializado = false;

    function togglePopup(usuario) {
        const popup = document.getElementById('ng-chat-popup');
        const badge = document.getElementById('ng-chat-badge');
        if (popup.classList.contains('open')) {
            fecharPopup();
        } else {
            popup.classList.add('open');
            badge.style.display = 'none';
            badge.textContent = '';
            if (!inicializado) {
                inicializado = true;
                iniciarChat(usuario);
            } else {
                document.getElementById('ng-campo').focus();
            }
        }
    }

    function fecharPopup() {
        document.getElementById('ng-chat-popup').classList.remove('open');
    }

    // ── Estado do chat ────────────────────────────────────────────
    let E, meuId, pollingAtivo, ultimaMsgAtId, pixStr;

    function resetarEstado(usuario) {
        // Mantém o mesmo ID de conversa por sessão (localStorage)
        const storageKey = 'ngchat_id_' + (usuario.id || 'guest');
        meuId = localStorage.getItem(storageKey);
        if (!meuId) {
            meuId = 'w' + Date.now() + Math.random().toString(36).slice(2, 6);
            localStorage.setItem(storageKey, meuId);
        }

        pollingAtivo    = false;
        ultimaMsgAtId   = '';
        pixStr          = '';

        E = {
            step: 'inicio', nome: usuario.nome || '', wa: usuario.telefone || '',
            tipo: 'cliente', veiculo: 'moto',
            col: { cid: '', end: '' }, ent: { cid: '', end: '' },
            dest: { nome: '', tel: '' },
            valor: 0, distancia: 0, atEntrou: false, pagConfirmado: false, ant: null
        };
    }

    const DIGITAVEIS = new Set(['col_cid', 'ent_cid', 'col_end', 'ent_end', 'dest_nome', 'dest_tel', 'livre']);

    // ── Iniciar chat ──────────────────────────────────────────────
    async function iniciarChat(usuario) {
        resetarEstado(usuario);
        await api('POST', `${RAILWAY_URL}/api/conv`, { id: meuId });
        await saveConv({ nome: E.nome, whatsapp: E.wa, userType: 'cliente' });

        // Verifica se tem pedido anterior
        const ant = await api('GET', `${RAILWAY_URL}/api/historico?nome=${enc(E.nome)}&whatsapp=${enc(E.wa)}&excluir=${meuId}`);

        if (ant && (ant.info?.coleta?.cidade || ant.info?.entrega?.cidade)) {
            E.ant = ant;
            const co  = ant.info.coleta?.cidade  || '—';
            const en  = ant.info.entrega?.cidade || '—';
            const eco = ant.info.coleta?.endereco  ? `<br><small style="color:#667781">${ant.info.coleta.endereco}</small>` : '';
            const een = ant.info.entrega?.endereco ? `<br><small style="color:#667781">${ant.info.entrega.endereco}</small>` : '';
            typing(() => addMsg(
                `👋 Olá, <strong>${primeiroNome(E.nome)}</strong>! Que bom te ver de volta! 🎉<br><br>Última entrega:<br>📍 <strong>Coleta:</strong> ${co}${eco}<br>📍 <strong>Entrega:</strong> ${en}${een}<br><br>Os endereços são os <strong>mesmos</strong>?`,
                'bot',
                [
                    { t: '✅ Sim, usar esses', fn: usarAnt  },
                    { t: '❌ Não, informar novos', fn: novoEnd }
                ]
            ), 900);
        } else {
            typing(() => addMsg(
                `👋 Olá, <strong>${primeiroNome(E.nome)}</strong>! Bem-vindo(a) à N&G Express! 🚚<br><br>O que você precisa?`,
                'bot',
                [
                    { t: '🚚 Solicitar Entrega',    fn: solicitar },
                    { t: '💬 Falar com Atendente', fn: falarAt   }
                ]
            ), 900);
        }
    }

    function primeiroNome(nome) { return (nome || 'Cliente').split(' ')[0]; }
    function enc(s) { return encodeURIComponent(s); }

    // ── API helpers ───────────────────────────────────────────────
    async function api(method, url, body) {
        try {
            const o = { method, headers: { 'Content-Type': 'application/json' } };
            if (body) o.body = JSON.stringify(body);
            const res = await fetch(url, o);
            return res.ok ? res.json() : null;
        } catch { return null; }
    }
    const savMsg   = (tipo, texto) => api('POST', `${RAILWAY_URL}/api/conv/${meuId}/msgs`, { tipo, texto, atendente: '' });
    const saveConv = d             => api('PATCH', `${RAILWAY_URL}/api/conv/${meuId}`, d);

    // ── DOM helpers ───────────────────────────────────────────────
    const msgsEl  = () => document.getElementById('ng-msgs');
    const campoEl = () => document.getElementById('ng-campo');
    const benvEl  = () => document.getElementById('ng-benv');
    function hora() { return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }

    function atualizarInput() {
        const ok = DIGITAVEIS.has(E.step);
        campoEl().disabled = !ok;
        benvEl().disabled  = !ok;
        if (ok) campoEl().focus();
    }

    function addMsg(html, lado = 'bot', opcoes = null, salvar = true) {
        const div = document.createElement('div');
        div.className = `ng-msg ng-${lado}`;
        const bal = document.createElement('div');
        bal.className = 'ng-bal';
        bal.innerHTML = html;
        div.appendChild(bal);
        const h = document.createElement('div');
        h.className = 'ng-hr'; h.textContent = hora();
        div.appendChild(h);
        if (opcoes) {
            const row = document.createElement('div'); row.className = 'ng-opts';
            opcoes.forEach(op => {
                const b = document.createElement('button'); b.className = 'ng-ob'; b.textContent = op.t;
                b.onclick = () => { row.querySelectorAll('button').forEach(x => x.disabled = true); addMsg(op.t, 'usr'); op.fn(); };
                row.appendChild(b);
            });
            div.appendChild(row);
        }
        const m = msgsEl(); m.appendChild(div); m.scrollTop = m.scrollHeight;
        if (lado === 'bot' && salvar) savMsg('bot', html.replace(/<[^>]+>/g, ''));
    }

    function typing(cb, delay = 1000) {
        const d = document.createElement('div');
        d.className = 'ng-msg ng-bot'; d.id = 'ng-typing';
        d.innerHTML = '<div class="ng-typing"><span></span><span></span><span></span></div>';
        const m = msgsEl(); m.appendChild(d); m.scrollTop = m.scrollHeight;
        setTimeout(() => {
            const t = document.getElementById('ng-typing'); if (t) t.remove();
            cb(); atualizarInput();
        }, delay);
    }

    // ── Fluxo ─────────────────────────────────────────────────────
    function usarAnt() {
        E.col  = { cid: E.ant.info.coleta?.cidade  || '', end: E.ant.info.coleta?.endereco  || '' };
        E.ent  = { cid: E.ant.info.entrega?.cidade || '', end: E.ant.info.entrega?.endereco || '' };
        E.dest = { nome: E.ant.info.destinatario?.nome || E.nome, tel: E.ant.info.destinatario?.tel || E.wa };
        E.step = 'auto'; atualizarInput();
        typing(() => calcRota(), 600);
    }

    function novoEnd() {
        E.step = 'col_cid'; atualizarInput();
        typing(() => addMsg('📍 Qual a <strong>cidade de coleta</strong>?'), 600);
    }

    function solicitar() {
        E.step = 'col_cid'; atualizarInput();
        typing(() => addMsg('📍 Qual a <strong>cidade de coleta</strong>?'), 600);
    }

    async function falarAt() {
        await saveConv({ userType: 'cliente' });
        E.step = 'espera_at'; atualizarInput();
        typing(() => {
            addMsg('✅ Solicitação enviada!<br><br>⏳ Aguardando um atendente disponível...');
            const b = document.createElement('div');
            b.className = 'ng-bpag';
            b.innerHTML = '<strong>⏳ Aguardando atendente</strong><span>Você será notificado quando entrar na conversa.</span>';
            const m = msgsEl(); m.appendChild(b); m.scrollTop = m.scrollHeight;
            iniciarPolling();
        }, 900);
    }

    function perguntarReceptor() {
        E.step = 'quem_recebe'; atualizarInput();
        typing(() => addMsg('👤 Quem irá <strong>receber</strong> a entrega?', 'bot', [
            { t: '🙋 Serei eu',     fn: () => { E.dest = { nome: E.nome, tel: E.wa }; calcRota(); } },
            { t: '👥 Outra pessoa', fn: () => { E.step = 'dest_nome'; atualizarInput(); typing(() => addMsg('👤 Nome de quem vai receber?'), 600); } }
        ]), 700);
    }

    // ── Calcular rota ─────────────────────────────────────────────
    const _geoCache = {};
    async function geocodificar(end) {
        const k = `gc_${end}`;
        if (_geoCache[k]) return _geoCache[k];
        const url = `https://nominatim.openstreetmap.org/search?q=${enc(end)}&format=json&countrycodes=br&limit=1`;
        const res = await fetch(url, { headers: { 'User-Agent': 'NGExpress/1.0' } });
        if (!res.ok) throw new Error('Geocodificação falhou');
        const data = await res.json();
        if (!data.length) throw new Error(`Endereço não encontrado: "${end}"`);
        const r = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        _geoCache[k] = r; return r;
    }

    async function calcularRotaHere(orig, dest) {
        const url = `https://router.hereapi.com/v8/routes?transportMode=car&origin=${orig.lat},${orig.lng}&destination=${dest.lat},${dest.lng}&return=summary&apikey=${HERE_API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Erro ao calcular rota');
        const data = await res.json();
        const sec = data.routes?.[0]?.sections?.[0];
        if (!sec) throw new Error('Nenhuma rota encontrada');
        const km = sec.summary.length / 1000;
        const min = Math.round(sec.summary.duration / 60);
        return {
            distanciaKm: km,
            distanciaTexto: `${km.toFixed(1)} km`,
            duracaoTexto: min < 60 ? `${min} min` : `${Math.floor(min/60)}h ${min%60}min`
        };
    }

    function calcPreco(km) {
        const v = 'moto';
        const preco = km <= PRICING.limiteKmMinimo
            ? PRICING.valorMinimoAte7km[v]
            : km * PRICING.valorPorKm[v];
        return Math.min(Math.round(preco * 100) / 100, PRICING.valorMaximo);
    }

    async function calcRota() {
        E.step = 'calc'; atualizarInput();
        const endC = E.col.end ? `${E.col.end}, ${E.col.cid}, Brasil` : `${E.col.cid}, Brasil`;
        const endE = E.ent.end ? `${E.ent.end}, ${E.ent.cid}, Brasil` : `${E.ent.cid}, Brasil`;

        const d = document.createElement('div');
        d.className = 'ng-msg ng-bot'; d.id = 'ng-typing';
        d.innerHTML = '<div class="ng-typing"><span></span><span></span><span></span></div>';
        const m = msgsEl(); m.appendChild(d); m.scrollTop = m.scrollHeight;

        try {
            const [cC, cE] = await Promise.all([geocodificar(endC), geocodificar(endE)]);
            const rota = await calcularRotaHere(cC, cE);
            const preco = calcPreco(rota.distanciaKm);
            E.valor = preco; E.distancia = rota.distanciaKm;

            const t = document.getElementById('ng-typing'); if (t) t.remove();

            let r = `✅ <strong>ROTA CALCULADA</strong><br><br>`;
            r += `📏 ${rota.distanciaTexto} &nbsp;•&nbsp; ⏱️ ${rota.duracaoTexto} &nbsp;•&nbsp; 💰 <strong>R$ ${preco.toFixed(2).replace('.', ',')}</strong><br><br>`;
            r += `📍 Coleta: ${E.col.cid}`;
            if (E.col.end) r += `<br><small style="color:#667781">${E.col.end}</small>`;
            r += `<br>📍 Entrega: ${E.ent.cid}`;
            if (E.ent.end) r += `<br><small style="color:#667781">${E.ent.end}</small>`;
            if (E.dest.nome) r += `<br><br>👤 Receptor: <strong>${E.dest.nome}</strong>`;

            addMsg(r, 'bot', [
                { t: '✅ Confirmar e pagar', fn: confirmarPagar },
                { t: '❌ Cancelar',          fn: cancelar       }
            ]);
        } catch (err) {
            const t = document.getElementById('ng-typing'); if (t) t.remove();
            addMsg(`⚠️ Não consegui calcular a rota.<br><small style="color:#667781">${err.message}</small><br><br>Fale com o atendente para orçamento.`,
                'bot', [{ t: '💬 Falar com Atendente', fn: falarAt }]);
        }
        E.step = 'confirm'; atualizarInput();
    }

    // ── Confirmar e gerar PIX ─────────────────────────────────────
    async function confirmarPagar() {
        E.step = 'aguard_pag'; atualizarInput();
        await saveConv({
            userType: 'cliente', valor: E.valor, distancia: E.distancia, veiculo: 'moto',
            aguardandoConfirmacao: true,
            coleta:       { cidade: E.col.cid, endereco: E.col.end },
            entrega:      { cidade: E.ent.cid, endereco: E.ent.end },
            destinatario: { nome: E.dest.nome, tel: E.dest.tel }
        });

        const d = document.createElement('div');
        d.className = 'ng-msg ng-bot'; d.id = 'ng-typing';
        d.innerHTML = '<div class="ng-typing"><span></span><span></span><span></span></div>';
        const m = msgsEl(); m.appendChild(d); m.scrollTop = m.scrollHeight;

        try {
            const resp = await fetch(`${RAILWAY_URL}/api/pix/criar`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ convId: meuId, valor: E.valor, nomeCliente: E.nome })
            });
            const t = document.getElementById('ng-typing'); if (t) t.remove();
            if (!resp.ok) { const err = await resp.json().catch(() => ({})); throw new Error(err.erro || `HTTP ${resp.status}`); }
            const dados = await resp.json();
            addMsg('💳 Realize o pagamento via PIX:');
            setTimeout(() => { exibirPix(dados.qrCode, dados.qrCodeBase64, dados.valor); setTimeout(() => { bannerAguardando(); iniciarPolling(); }, 400); }, 400);
        } catch (err) {
            const t = document.getElementById('ng-typing'); if (t) t.remove();
            addMsg(`⚠️ Não foi possível gerar o PIX.<br><small style="color:#667781">${err.message}</small>`,
                'bot', [{ t: '💬 Falar com Atendente', fn: falarAt }]);
            E.step = 'col_cid'; atualizarInput();
        }
    }

    function cancelar() {
        E.col = { cid: '', end: '' }; E.ent = { cid: '', end: '' }; E.dest = { nome: '', tel: '' };
        E.step = 'col_cid';
        typing(() => addMsg('❌ Cancelado. Deseja uma nova entrega?', 'bot', [
            { t: '🚚 Nova Solicitação',     fn: solicitar },
            { t: '💬 Falar com Atendente', fn: falarAt   }
        ]), 600);
    }

    // ── PIX display ───────────────────────────────────────────────
    function exibirPix(qrCode, qrCodeBase64, valor) {
        pixStr = qrCode;
        const div = document.createElement('div'); div.className = 'ng-msg ng-bot';
        const qrHtml = qrCodeBase64
            ? `<div class="ng-pix-qr"><img src="data:image/png;base64,${qrCodeBase64}" alt="QR Code PIX"></div>`
            : '';
        div.innerHTML = `
            <div class="ng-pix">
                <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
                    <span style="font-size:20px;">💚</span>
                    <div><div style="font-size:.78rem;font-weight:700;color:#2e7d32;">Pagamento via PIX</div>
                    <div style="font-size:.62rem;color:#666;">Mercado Pago • Escaneie ou copie</div></div>
                </div>
                <div class="ng-pix-v">R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}</div>
                ${qrHtml}
                <div class="ng-pix-cod" id="ng-pix-cod" onclick="window.__ngCopiarPix && window.__ngCopiarPix()">${qrCode}</div>
                <div class="ng-pix-hint">👆 Toque no código para copiar</div>
            </div>`;
        const m = msgsEl(); m.appendChild(div); m.scrollTop = m.scrollHeight;
        savMsg('bot', `PIX R$ ${valor} gerado`);

        window.__ngCopiarPix = () => {
            navigator.clipboard?.writeText(pixStr).then(() => {
                const el = document.getElementById('ng-pix-cod');
                if (el) { el.textContent = '✅ Copiado!'; setTimeout(() => el.textContent = pixStr, 2500); }
            });
        };
    }

    function bannerAguardando() {
        const b = document.createElement('div'); b.className = 'ng-bpag'; b.id = 'ng-bpag';
        b.innerHTML = '<strong>⏳ Aguardando pagamento PIX</strong><span>Após pagar será confirmado automaticamente.</span><div class="ng-pdots"><i></i><i></i><i></i></div>';
        const m = msgsEl(); m.appendChild(b); m.scrollTop = m.scrollHeight;
    }

    // ── Input handler ─────────────────────────────────────────────
    function enviar() {
        const campo = campoEl();
        const msg = campo.value.trim();
        if (!msg || !DIGITAVEIS.has(E.step)) return;

        const div = document.createElement('div'); div.className = 'ng-msg ng-usr';
        div.innerHTML = `<div class="ng-bal">${msg}</div><div class="ng-hr">${hora()}</div>`;
        const m = msgsEl(); m.appendChild(div); m.scrollTop = m.scrollHeight;
        savMsg('user', msg);
        campo.value = '';

        switch (E.step) {
            case 'col_cid':   E.col.cid = msg; E.step = 'ent_cid'; atualizarInput(); typing(() => addMsg(`✅ Coleta: <strong>${msg}</strong><br><br>📍 Qual a <strong>cidade de entrega</strong>?`)); break;
            case 'ent_cid':   E.ent.cid = msg; E.step = 'col_end'; atualizarInput(); typing(() => addMsg('🏠 Endereço de <strong>coleta</strong><br><small style="color:#667781">Rua, Número, Bairro</small>')); break;
            case 'col_end':   E.col.end = msg; E.step = 'ent_end'; atualizarInput(); typing(() => addMsg('🏠 Endereço de <strong>entrega</strong><br><small style="color:#667781">Rua, Número, Bairro</small>')); break;
            case 'ent_end':   E.ent.end = msg; perguntarReceptor(); break;
            case 'dest_nome': E.dest.nome = msg; E.step = 'dest_tel'; atualizarInput(); typing(() => addMsg(`📱 WhatsApp de <strong>${msg}</strong>?`)); break;
            case 'dest_tel':  E.dest.tel = msg; calcRota(); break;
            case 'livre':     break;
        }
    }

    // ── Polling (atendente + pagamento) ───────────────────────────
    function iniciarPolling() {
        if (pollingAtivo) return;
        pollingAtivo = true;
        setInterval(poll, 2500);
    }

    async function poll() {
        const conv = await api('GET', `${RAILWAY_URL}/api/conv/${meuId}`);
        if (!conv) return;
        const info = conv.info, msgs = conv.msgs || [];

        // Atendente entrou
        if (info.atendenteAtivo && !E.atEntrou && E.step === 'espera_at') {
            E.atEntrou = true; E.step = 'livre'; atualizarInput();
            addMsg(`✅ <strong>${info.atendenteAtivo}</strong> entrou na conversa! Pode digitar. 😊`);
            mostrarBadge();
        }

        // Pagamento confirmado
        if (info.pagamentoConfirmado && !E.pagConfirmado) {
            E.pagConfirmado = true; E.step = 'fim'; atualizarInput();
            const b = document.getElementById('ng-bpag'); if (b) b.remove();
            addMsg(`✅ <strong>Pagamento confirmado!</strong><br><br>🚚 Sua entrega foi registrada!<br><br>Obrigado, <strong>${primeiroNome(E.nome)}</strong>! 💚`, 'bot',
                [{ t: '📦 Nova Solicitação', fn: () => { E.pagConfirmado = false; E.valor = 0; solicitar(); } }]);
            mostrarBadge();
        }

        // Mensagens do atendente
        if (E.atEntrou || info.atendenteAtivo) {
            const atMsgs = msgs.filter(m => m.tipo === 'atendente');
            atMsgs.forEach(m => {
                if (m.id > ultimaMsgAtId) {
                    addMsg(`👩‍💼 <strong>${m.atendente}:</strong> ${m.texto}`, 'bot', null, false);
                    if (!document.getElementById('ng-chat-popup').classList.contains('open')) mostrarBadge();
                }
            });
            if (atMsgs.length) ultimaMsgAtId = atMsgs[atMsgs.length - 1].id;
        }
    }

    function mostrarBadge() {
        if (document.getElementById('ng-chat-popup').classList.contains('open')) return;
        const badge = document.getElementById('ng-chat-badge');
        const count = parseInt(badge.textContent || '0') + 1;
        badge.textContent = count > 9 ? '9+' : count;
        badge.style.display = 'flex';
    }

    // ── Start ─────────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();