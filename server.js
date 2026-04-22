require('dotenv').config();

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const https   = require('https');
const { v4: uuid } = require('uuid');
const initSql = require('sql.js');
const bcrypt  = require('bcryptjs');

const app     = express();
const PORT    = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'banco.db');

const MP_ACCESS_TOKEN   = process.env.MP_ACCESS_TOKEN;
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

console.log('🔑 MP_ACCESS_TOKEN:',   MP_ACCESS_TOKEN   ? '✅ OK' : '❌ NÃO CONFIGURADO');
console.log('🔐 MP_WEBHOOK_SECRET:', MP_WEBHOOK_SECRET ? '✅ OK' : '❌ NÃO CONFIGURADO');
console.log('🌐 BASE_URL:', BASE_URL);

function isValidWebhookUrl(url) {
    try { const p = new URL(url); return p.protocol === 'https:'; } catch { return false; }
}
const WEBHOOK_URL = isValidWebhookUrl(`${BASE_URL}/api/pix/webhook`)
    ? `${BASE_URL}/api/pix/webhook` : null;
console.log('🔗 Webhook URL:', WEBHOOK_URL || '❌ não configurado (pagamento manual)');

// =============================================================
// CORS — resolve "wildcard + credentials" de uma vez só
// Netlify envia credenciais, então precisamos de origem exata
// =============================================================
const ORIGENS_OK = [
    'https://ng-express.netlify.app',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
];

app.use((req, res, next) => {
    const origem = req.headers.origin || '';
    if (ORIGENS_OK.includes(origem)) {
        res.setHeader('Access-Control-Allow-Origin', origem);
        res.setHeader('Vary', 'Origin');
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
    next();
});

app.use(express.json({ limit: '25mb' }));

// Arquivos estáticos
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) app.use(express.static(publicDir));
app.use(express.static(__dirname, { index: false }));

// =============================================================
// MIDDLEWARE — remove .php preservando query string
// /api/admin/dados.php?aid=123  →  /api/admin/dados?aid=123
// =============================================================
app.use((req, res, next) => {
    if (req.path.endsWith('.php')) {
        const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        req.url  = req.path.replace(/\.php$/, '') + qs;
    }
    next();
});

// =============================================================
// BANCO DE DADOS (SQLite via sql.js)
// =============================================================
let DB;

async function abrirBanco() {
    const SQL = await initSql();
    DB = fs.existsSync(DB_FILE)
        ? new SQL.Database(fs.readFileSync(DB_FILE))
        : new SQL.Database();

    DB.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        telefone TEXT DEFAULT '',
        senha_hash TEXT NOT NULL,
        criado INTEGER
    )`);

    DB.run(`CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL,
        criado INTEGER
    )`);

    DB.run(`CREATE TABLE IF NOT EXISTS historico_orcamentos (
        id TEXT PRIMARY KEY,
        usuario_id TEXT,
        numero_pedido TEXT,
        tipo_veiculo TEXT DEFAULT 'moto',
        endereco_coleta TEXT DEFAULT '',
        endereco_entrega TEXT DEFAULT '',
        descricao TEXT DEFAULT '',
        valor_total REAL DEFAULT 0,
        payment_id TEXT DEFAULT '',
        status_pagamento TEXT DEFAULT 'pendente',
        data_pagamento INTEGER,
        data_orcamento INTEGER,
        criado INTEGER
    )`);

    DB.run(`CREATE TABLE IF NOT EXISTS conversas (
        id TEXT PRIMARY KEY,
        nome TEXT DEFAULT '', whatsapp TEXT DEFAULT '',
        user_type TEXT DEFAULT '', atendente TEXT DEFAULT '',
        aberta INTEGER DEFAULT 1, lida INTEGER DEFAULT 0, arquivada INTEGER DEFAULT 0,
        valor REAL DEFAULT 0, pix TEXT DEFAULT '', mp_payment_id TEXT DEFAULT '',
        aguard_pag INTEGER DEFAULT 0, pag_conf INTEGER DEFAULT 0,
        coleta_cidade TEXT DEFAULT '', coleta_end TEXT DEFAULT '',
        entrega_cidade TEXT DEFAULT '', entrega_end TEXT DEFAULT '',
        dest_nome TEXT DEFAULT '', dest_tel TEXT DEFAULT '',
        motoboy_regiao TEXT DEFAULT '', ultima TEXT DEFAULT '',
        distancia_km REAL DEFAULT 0, veiculo TEXT DEFAULT 'moto',
        criada INTEGER, atualizada INTEGER
    )`);

    DB.run(`CREATE TABLE IF NOT EXISTS msgs (
        id TEXT PRIMARY KEY, conv_id TEXT,
        tipo TEXT, texto TEXT DEFAULT '', atendente TEXT DEFAULT '', ts INTEGER
    )`);

    DB.run(`CREATE TABLE IF NOT EXISTS arquivos (
        id TEXT PRIMARY KEY, conv_id TEXT,
        nome TEXT DEFAULT '', mime TEXT DEFAULT '', dados TEXT DEFAULT '', ts INTEGER
    )`);

    // Migrações silenciosas (adiciona colunas que podem não existir em bancos antigos)
    const migs = [
        `ALTER TABLE conversas ADD COLUMN mp_payment_id TEXT DEFAULT ''`,
        `ALTER TABLE conversas ADD COLUMN aguard_pag INTEGER DEFAULT 0`,
        `ALTER TABLE conversas ADD COLUMN pag_conf INTEGER DEFAULT 0`,
        `ALTER TABLE conversas ADD COLUMN arquivada INTEGER DEFAULT 0`,
        `ALTER TABLE conversas ADD COLUMN user_type TEXT DEFAULT ''`,
        `ALTER TABLE conversas ADD COLUMN atendente TEXT DEFAULT ''`,
        `ALTER TABLE conversas ADD COLUMN pix TEXT DEFAULT ''`,
        `ALTER TABLE conversas ADD COLUMN ultima TEXT DEFAULT ''`,
        `ALTER TABLE conversas ADD COLUMN distancia_km REAL DEFAULT 0`,
        `ALTER TABLE conversas ADD COLUMN veiculo TEXT DEFAULT 'moto'`,
        `ALTER TABLE historico_orcamentos ADD COLUMN data_orcamento INTEGER`,
        `ALTER TABLE historico_orcamentos ADD COLUMN status_pagamento TEXT DEFAULT 'pendente'`,
        `ALTER TABLE historico_orcamentos ADD COLUMN data_pagamento INTEGER`,
    ];
    for (const sql of migs) { try { DB.run(sql); } catch (_) {} }

    // Admin padrão
    if (!um('SELECT id FROM admins WHERE email=?', ['admin@ngexpress.com.br'])) {
        const h = await bcrypt.hash('admin123', 10);
        rodar('INSERT INTO admins (id,nome,email,senha_hash,criado) VALUES (?,?,?,?,?)',
            [uuid(), 'Administrador', 'admin@ngexpress.com.br', h, agora()]);
        console.log('✅ Admin criado: admin@ngexpress.com.br / admin123');
    }

    // Garante usuário Gabi com hash bcrypt correto
    await garantirUsuario('Gabriele', 'gabi.05assis9@gmail.com', 'Ng142536');

    salvar();
    console.log('✅ Banco pronto:', DB_FILE,
        `| admins: ${um('SELECT COUNT(*) AS c FROM admins')?.c}`,
        `| usuarios: ${um('SELECT COUNT(*) AS c FROM usuarios')?.c}`);
}

async function garantirUsuario(nome, email, senha) {
    const emailNorm = email.toLowerCase().trim();
    const u = um('SELECT * FROM usuarios WHERE email=?', [emailNorm]);
    const novoHash = await bcrypt.hash(senha, 10);
    if (!u) {
        rodar('INSERT INTO usuarios (id,nome,email,telefone,senha_hash,criado) VALUES (?,?,?,?,?,?)',
            [uuid(), nome, emailNorm, '', novoHash, agora()]);
        console.log(`✅ Usuário criado: ${emailNorm}`);
        return;
    }
    // Testa se senha atual funciona (bcrypt $2b$ ou PHP $2y$)
    let ok = false;
    try { ok = await bcrypt.compare(senha, u.senha_hash); } catch (_) {}
    if (!ok && u.senha_hash?.startsWith('$2y$')) {
        try { ok = await bcrypt.compare(senha, u.senha_hash.replace('$2y$', '$2b$')); } catch (_) {}
    }
    if (!ok) {
        rodar('UPDATE usuarios SET senha_hash=? WHERE email=?', [novoHash, emailNorm]);
        console.log(`🔄 Hash atualizado: ${emailNorm}`);
    } else {
        console.log(`✅ Hash OK: ${emailNorm}`);
    }
}

function salvar() { fs.writeFileSync(DB_FILE, Buffer.from(DB.export())); }
function rodar(sql, p = []) { DB.run(sql, p); salvar(); }
function um(sql, p = []) {
    const s = DB.prepare(sql); s.bind(p);
    const r = s.step() ? s.getAsObject() : null; s.free(); return r;
}
function todos(sql, p = []) {
    const out = [], s = DB.prepare(sql); s.bind(p);
    while (s.step()) out.push(s.getAsObject()); s.free(); return out;
}
function agora() { return Date.now(); }

// =============================================================
// MERCADO PAGO
// =============================================================
function mpReq(method, endpoint, body) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const opts = {
            hostname: 'api.mercadopago.com', path: endpoint, method,
            headers: {
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': uuid(),
            }
        };
        if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
        const req = https.request(opts, res => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
                catch (e) { reject(new Error('MP resposta inválida: ' + raw.slice(0, 200))); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

// =============================================================
// PÁGINAS
// =============================================================
app.get('/', (req, res) => {
    const f = fs.existsSync(path.join(publicDir, 'chatbot-cliente.html'))
        ? path.join(publicDir, 'chatbot-cliente.html')
        : path.join(__dirname, 'index.html');
    res.sendFile(f);
});
app.get('/painel', (req, res) => {
    const f = path.join(__dirname, 'painel-atendentes.html');
    fs.existsSync(f) ? res.sendFile(f) : res.status(404).send('Não encontrado');
});

// =============================================================
// USUÁRIOS
// =============================================================
app.post('/api/usuarios/cadastrar', async (req, res) => {
    const { nome, email, telefone, senha } = req.body || {};
    if (!nome || !email || !telefone || !senha)
        return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios' });
    if (senha.length < 6)
        return res.status(400).json({ success: false, message: 'Senha mínimo 6 caracteres' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ success: false, message: 'E-mail inválido' });
    if (um('SELECT id FROM usuarios WHERE email=?', [email.toLowerCase().trim()]))
        return res.status(409).json({ success: false, message: 'E-mail já cadastrado' });
    try {
        const id = uuid(), hash = await bcrypt.hash(senha, 10);
        rodar('INSERT INTO usuarios (id,nome,email,telefone,senha_hash,criado) VALUES (?,?,?,?,?,?)',
            [id, nome.trim(), email.toLowerCase().trim(), String(telefone).trim(), hash, agora()]);
        res.json({ success: true, message: 'Cadastro realizado!',
            usuario: { id, nome: nome.trim(), email: email.toLowerCase().trim(), telefone: String(telefone).trim() } });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/usuarios/login', async (req, res) => {
    const { email, senha } = req.body || {};
    if (!email || !senha)
        return res.status(400).json({ success: false, message: 'E-mail e senha obrigatórios' });
    const u = um('SELECT * FROM usuarios WHERE email=?', [email.toLowerCase().trim()]);
    if (!u) return res.status(401).json({ success: false, message: 'E-mail ou senha inválidos' });
    try {
        let ok = false;
        try { ok = await bcrypt.compare(senha, u.senha_hash); } catch (_) {}
        // Compatibilidade PHP $2y$ → $2b$
        if (!ok && u.senha_hash?.startsWith('$2y$')) {
            try { ok = await bcrypt.compare(senha, u.senha_hash.replace('$2y$', '$2b$')); } catch (_) {}
            if (ok) {
                rodar('UPDATE usuarios SET senha_hash=? WHERE id=?', [await bcrypt.hash(senha, 10), u.id]);
                console.log(`🔄 Hash PHP→bcrypt migrado: ${email}`);
            }
        }
        if (!ok) return res.status(401).json({ success: false, message: 'E-mail ou senha inválidos' });
        res.json({ success: true, usuario: { id: u.id, nome: u.nome, email: u.email, telefone: u.telefone || '' } });
    } catch (e) { res.status(500).json({ success: false, message: 'Erro interno' }); }
});

app.post('/api/usuarios/logout',    (req, res) => res.json({ success: true }));
app.get ('/api/usuarios/verificar', (req, res) => res.json({ logado: false }));

app.post('/api/usuarios/atualizar', async (req, res) => {
    const { id, nome, telefone, senha } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'id obrigatório' });
    const campos = [], vals = [];
    if (nome)     { campos.push('nome=?');     vals.push(nome.trim()); }
    if (telefone) { campos.push('telefone=?'); vals.push(String(telefone).trim()); }
    if (senha?.length >= 6) { campos.push('senha_hash=?'); vals.push(await bcrypt.hash(senha, 10)); }
    if (campos.length) { vals.push(id); rodar(`UPDATE usuarios SET ${campos.join(',')} WHERE id=?`, vals); }
    res.json({ success: true });
});

// =============================================================
// ADMIN
// =============================================================
app.post('/api/admin/login', async (req, res) => {
    const { email, senha } = req.body || {};
    if (!email || !senha)
        return res.status(400).json({ success: false, message: 'E-mail e senha obrigatórios' });
    const a = um('SELECT * FROM admins WHERE email=?', [email.toLowerCase().trim()]);
    if (!a) return res.status(401).json({ success: false, message: 'E-mail ou senha inválidos' });
    try {
        let ok = false;
        try { ok = await bcrypt.compare(senha, a.senha_hash); } catch (_) {}
        if (!ok && a.senha_hash?.startsWith('$2y$')) {
            try { ok = await bcrypt.compare(senha, a.senha_hash.replace('$2y$', '$2b$')); } catch (_) {}
            if (ok) rodar('UPDATE admins SET senha_hash=? WHERE id=?', [await bcrypt.hash(senha, 10), a.id]);
        }
        if (!ok) return res.status(401).json({ success: false, message: 'E-mail ou senha inválidos' });
        res.json({ success: true, admin: { id: a.id, nome: a.nome, email: a.email } });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/logout', (req, res) => res.json({ success: true }));

app.get('/api/admin/dados', (req, res) => {
    // Aceita ?aid=ID  OU  Authorization: Bearer ID
    let aid = req.query.aid;
    if (!aid) {
        const auth = req.headers.authorization || '';
        if (auth.startsWith('Bearer ')) aid = auth.slice(7).trim();
    }
    if (!aid || aid === 'undefined' || aid === 'null')
        return res.status(401).json({ success: false, message: 'Acesso negado: aid não informado' });
    if (!um('SELECT id FROM admins WHERE id=?', [aid]))
        return res.status(401).json({ success: false, message: 'Acesso negado: admin não encontrado' });

    try {
        const nCorreidas  = um('SELECT COUNT(*) AS c FROM historico_orcamentos');
        const nFaturado   = um('SELECT COALESCE(SUM(valor_total),0) AS s FROM historico_orcamentos');
        const nUsuarios   = um('SELECT COUNT(*) AS c FROM usuarios');
        const porVeiculo  = todos(`SELECT tipo_veiculo, COUNT(*) AS total FROM historico_orcamentos GROUP BY tipo_veiculo`);
        const corridas    = todos(`
            SELECT h.id, h.numero_pedido, h.tipo_veiculo,
                   h.endereco_coleta, h.endereco_entrega,
                   h.valor_total, h.status_pagamento AS status, h.data_orcamento,
                   u.nome AS usuario_nome, u.email AS usuario_email, u.telefone AS usuario_telefone
            FROM historico_orcamentos h
            LEFT JOIN usuarios u ON u.id = h.usuario_id
            ORDER BY COALESCE(h.data_orcamento, h.criado) DESC LIMIT 50`);
        const topUsuarios = todos(`
            SELECT u.nome, u.email, u.telefone,
                   COUNT(h.id) AS total_pedidos,
                   COALESCE(SUM(h.valor_total),0) AS total_gasto
            FROM usuarios u
            LEFT JOIN historico_orcamentos h ON h.usuario_id = u.id
            GROUP BY u.id ORDER BY total_pedidos DESC LIMIT 10`);

        res.json({
            success: true,
            totalCorridas: parseInt(nCorreidas?.c  || 0),
            totalFaturado: parseFloat(nFaturado?.s || 0),
            totalUsuarios: parseInt(nUsuarios?.c   || 0),
            porVeiculo,
            corridas: corridas.map(c => ({
                ...c,
                data_orcamento: c.data_orcamento
                    ? new Date(Number(c.data_orcamento)).toISOString() : null
            })),
            topUsuarios,
        });
    } catch (e) {
        console.error('Erro admin/dados:', e.message);
        res.status(500).json({ success: false, message: 'Erro ao carregar dados: ' + e.message });
    }
});

// =============================================================
// ORÇAMENTOS
// =============================================================
app.post('/api/orcamentos/salvar', (req, res) => {
    const { usuario_id, numero_pedido, tipo_veiculo, endereco_coleta, endereco_entrega, descricao, valor_total } = req.body || {};
    if (!usuario_id) return res.status(400).json({ success: false, message: 'usuario_id obrigatório' });
    const id = uuid(), now = agora();
    rodar(`INSERT INTO historico_orcamentos
        (id,usuario_id,numero_pedido,tipo_veiculo,endereco_coleta,endereco_entrega,descricao,valor_total,data_orcamento,criado)
        VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [id, usuario_id, numero_pedido || `NG${Date.now().toString().slice(-6)}`,
         tipo_veiculo || 'moto', endereco_coleta || '', endereco_entrega || '',
         descricao || '', parseFloat(valor_total) || 0, now, now]);
    res.json({ success: true, id });
});

// /api/orcamentos/historico?uid=XXX  (usado por dashboard.html)
app.get('/api/orcamentos/historico', (req, res) => {
    const uid = req.query.uid;
    if (!uid) return res.status(400).json({ success: false, message: 'uid obrigatório' });
    res.json({ success: true,
        orcamentos: todos('SELECT * FROM historico_orcamentos WHERE usuario_id=? ORDER BY criado DESC', [uid]) });
});

// rota legada /api/orcamentos/:id
app.get('/api/orcamentos/:uid', (req, res) => {
    res.json({ success: true,
        orcamentos: todos('SELECT * FROM historico_orcamentos WHERE usuario_id=? ORDER BY criado DESC', [req.params.uid]) });
});

// =============================================================
// PIX
// =============================================================
app.post('/api/pix/criar', async (req, res) => {
    const { convId, valor, nomeCliente, descricao } = req.body || {};
    if (!valor || parseFloat(valor) <= 0)
        return res.status(400).json({ success: false, erro: 'Valor inválido' });
    if (!MP_ACCESS_TOKEN)
        return res.status(503).json({ success: false, erro: 'MP_ACCESS_TOKEN não configurado' });

    const convIdFinal = convId || `pedido_${Date.now()}`;
    try {
        const mpBody = {
            transaction_amount: parseFloat(parseFloat(valor).toFixed(2)),
            description: descricao || `Entrega N&G Express #${convIdFinal.slice(-6).toUpperCase()}`,
            payment_method_id: 'pix',
            payer: {
                email: 'cliente@ngexpress.com.br',
                first_name: (nomeCliente || 'Cliente').split(' ')[0],
                last_name:  (nomeCliente || 'Cliente').split(' ').slice(1).join(' ') || 'NGExpress',
                identification: { type: 'CPF', number: '00000000000' }
            },
            external_reference: convIdFinal,
        };
        if (WEBHOOK_URL) mpBody.notification_url = WEBHOOK_URL;

        let resp = await mpReq('POST', '/v1/payments', mpBody);
        if (resp.status !== 201 && resp.body?.cause?.[0]?.code === 4020 && mpBody.notification_url) {
            delete mpBody.notification_url;
            resp = await mpReq('POST', '/v1/payments', mpBody);
        }
        if (resp.status !== 201)
            return res.status(502).json({ success: false, erro: 'Erro MP', detalhe: resp.body });

        const pix = resp.body.point_of_interaction?.transaction_data;
        if (!pix?.qr_code)
            return res.status(502).json({ success: false, erro: 'MP não retornou QR Code' });

        if (!um('SELECT id FROM conversas WHERE id=?', [convIdFinal]))
            rodar('INSERT INTO conversas (id,criada,atualizada) VALUES (?,?,?)', [convIdFinal, agora(), agora()]);
        rodar('UPDATE conversas SET mp_payment_id=?,pix=?,aguard_pag=1,valor=?,atualizada=? WHERE id=?',
            [String(resp.body.id), pix.qr_code, parseFloat(valor), agora(), convIdFinal]);

        res.json({ success: true, paymentId: resp.body.id, qrCode: pix.qr_code,
            qrCodeBase64: pix.qr_code_base64 || null, valor: resp.body.transaction_amount });
    } catch (e) { res.status(500).json({ success: false, erro: e.message }); }
});

app.get('/api/pix/status/:convId', async (req, res) => {
    const c = um('SELECT * FROM conversas WHERE id=?', [req.params.convId]);
    if (!c) return res.status(404).json({ erro: 'não encontrada' });
    if (!c.mp_payment_id) return res.json({ status: 'sem_cobranca' });
    try {
        const resp = await mpReq('GET', `/v1/payments/${c.mp_payment_id}`, null);
        if (resp.status !== 200) return res.status(502).json({ erro: 'Erro MP' });
        if (resp.body.status === 'approved' && !c.pag_conf)
            rodar('UPDATE conversas SET pag_conf=1,aguard_pag=0,atualizada=? WHERE id=?', [agora(), req.params.convId]);
        res.json({ status: resp.body.status, valor: resp.body.transaction_amount });
    } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.post('/api/pix/webhook', async (req, res) => {
    res.sendStatus(200);
    try {
        const { type, data } = req.body || {};
        if (type !== 'payment' || !data?.id) return;
        const resp = await mpReq('GET', `/v1/payments/${data.id}`, null);
        if (resp.status !== 200 || resp.body.status !== 'approved') return;
        const convId = resp.body.external_reference;
        if (!convId) return;
        const c = um('SELECT * FROM conversas WHERE id=?', [convId]);
        if (!c || c.pag_conf) return;
        rodar('UPDATE conversas SET pag_conf=1,aguard_pag=0,lida=0,atualizada=? WHERE id=?', [agora(), convId]);
        const ts = agora();
        rodar('INSERT INTO msgs (id,conv_id,tipo,texto,atendente,ts) VALUES (?,?,?,?,?,?)',
            [uuid(), convId, 'atendente', '✅ Pagamento confirmado! Em breve seu pedido será atendido. 🚚', 'Sistema', ts]);
        rodar('UPDATE conversas SET ultima=?,atualizada=? WHERE id=?', ['✅ Pagamento confirmado!', ts, convId]);
        rodar(`UPDATE historico_orcamentos SET status_pagamento='aprovado',data_pagamento=?,payment_id=? WHERE numero_pedido=?`,
            [agora(), String(data.id), convId]);
    } catch (e) { console.error('❌ Webhook:', e.message); }
});

// =============================================================
// CONVERSAS (chatbot)
// =============================================================
function montarConversa(c) {
    if (!c) return null;
    const msgs = todos('SELECT * FROM msgs WHERE conv_id=? ORDER BY ts ASC', [c.id]);
    const arqs = todos('SELECT id,nome,mime,dados,ts FROM arquivos WHERE conv_id=? ORDER BY ts ASC', [c.id]);
    return {
        id: c.id, aberta: !!c.aberta, lida: !!c.lida, arquivada: !!c.arquivada,
        ultima: c.ultima, ts: c.atualizada,
        msgs: msgs.map(m => ({ id: m.id, tipo: m.tipo, texto: m.texto, atendente: m.atendente, ts: m.ts })),
        arquivos: arqs.map(a => ({ id: a.id, nome: a.nome, mime: a.mime, dados: a.dados, ts: a.ts })),
        info: {
            nome: c.nome, whatsapp: c.whatsapp, userType: c.user_type, atendenteAtivo: c.atendente,
            valor: c.valor, pixPayload: c.pix, mpPaymentId: c.mp_payment_id,
            aguardandoConfirmacao: !!c.aguard_pag, pagamentoConfirmado: !!c.pag_conf,
            distancia: c.distancia_km, veiculo: c.veiculo,
            coleta:       { cidade: c.coleta_cidade,  endereco: c.coleta_end  },
            entrega:      { cidade: c.entrega_cidade, endereco: c.entrega_end },
            destinatario: { nome: c.dest_nome, tel: c.dest_tel },
            motoboy:      { regiao: c.motoboy_regiao }
        }
    };
}

app.post('/api/conv', (req, res) => {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ erro: 'id obrigatório' });
    let c = um('SELECT * FROM conversas WHERE id=?', [id]);
    if (!c) { rodar('INSERT INTO conversas (id,criada,atualizada) VALUES (?,?,?)', [id, agora(), agora()]); c = um('SELECT * FROM conversas WHERE id=?', [id]); }
    res.json(montarConversa(c));
});
app.get('/api/conv', (req, res) => res.json(todos('SELECT * FROM conversas WHERE arquivada=0 ORDER BY atualizada DESC').map(montarConversa)));
app.get('/api/conv/:id', (req, res) => {
    const c = um('SELECT * FROM conversas WHERE id=?', [req.params.id]);
    if (!c) return res.status(404).json({ erro: 'não encontrada' });
    res.json(montarConversa(c));
});
app.patch('/api/conv/:id', (req, res) => {
    const { id } = req.params, b = req.body || {};
    const c = um('SELECT * FROM conversas WHERE id=?', [id]);
    if (!c) return res.status(404).json({ erro: 'não encontrada' });
    const campos = [], vals = [];
    const add = (col, val) => { if (val !== undefined) { campos.push(`${col}=?`); vals.push(val); } };
    add('nome',b.nome); add('whatsapp',b.whatsapp); add('user_type',b.userType); add('atendente',b.atendente);
    add('aberta',    b.aberta    !==undefined?(b.aberta    ?1:0):undefined);
    add('lida',      b.lida      !==undefined?(b.lida      ?1:0):undefined);
    add('arquivada', b.arquivada !==undefined?(b.arquivada ?1:0):undefined);
    add('valor',b.valor); add('pix',b.pixPayload); add('mp_payment_id',b.mpPaymentId);
    add('aguard_pag',b.aguardandoConfirmacao!==undefined?(b.aguardandoConfirmacao?1:0):undefined);
    add('pag_conf',  b.pagamentoConfirmado  !==undefined?(b.pagamentoConfirmado  ?1:0):undefined);
    add('coleta_cidade',b.coleta?.cidade); add('coleta_end',b.coleta?.endereco);
    add('entrega_cidade',b.entrega?.cidade); add('entrega_end',b.entrega?.endereco);
    add('dest_nome',b.destinatario?.nome); add('dest_tel',b.destinatario?.tel);
    add('motoboy_regiao',b.motoboy?.regiao); add('distancia_km',b.distancia); add('veiculo',b.veiculo); add('ultima',b.ultima);
    if (campos.length) { campos.push('atualizada=?'); vals.push(agora(),id); rodar(`UPDATE conversas SET ${campos.join(',')} WHERE id=?`,vals); }
    res.json(montarConversa(um('SELECT * FROM conversas WHERE id=?', [id])));
});
app.delete('/api/conv/:id', (req, res) => {
    rodar('DELETE FROM msgs WHERE conv_id=?',[req.params.id]);
    rodar('DELETE FROM arquivos WHERE conv_id=?',[req.params.id]);
    rodar('DELETE FROM conversas WHERE id=?',[req.params.id]);
    res.json({ ok: true });
});
app.get('/api/historico', (req, res) => {
    const { nome, whatsapp, excluir } = req.query;
    if (!nome || !whatsapp) return res.json(null);
    const waNorm = whatsapp.replace(/\D/g,'');
    const lista  = todos(`SELECT * FROM conversas WHERE id!=? AND LOWER(TRIM(nome))=LOWER(TRIM(?)) AND arquivada=0 ORDER BY atualizada DESC`,[excluir||'',nome]);
    const match  = lista.find(c=>(c.whatsapp||'').replace(/\D/g,'')===waNorm&&(c.coleta_cidade||c.entrega_cidade));
    res.json(match?montarConversa(match):null);
});
app.post('/api/conv/:id/msgs', (req, res) => {
    const { tipo, texto, atendente } = req.body||{};
    const conv_id=req.params.id, id=uuid(), ts=agora();
    rodar('INSERT INTO msgs (id,conv_id,tipo,texto,atendente,ts) VALUES (?,?,?,?,?,?)',[id,conv_id,tipo,texto||'',atendente||'',ts]);
    if (tipo==='user') rodar('UPDATE conversas SET ultima=?,atualizada=?,lida=0 WHERE id=?',[(texto||'').substring(0,80),ts,conv_id]);
    else               rodar('UPDATE conversas SET ultima=?,atualizada=? WHERE id=?',[(texto||'').substring(0,80),ts,conv_id]);
    res.json({ id, ts, ok: true });
});
app.post('/api/conv/:id/arq', (req, res) => {
    const { nome, mime, dados } = req.body||{};
    if (!dados) return res.status(400).json({ erro: 'dados obrigatório' });
    const id=uuid(), ts=agora();
    rodar('INSERT INTO arquivos (id,conv_id,nome,mime,dados,ts) VALUES (?,?,?,?,?,?)',[id,req.params.id,nome||'arquivo',mime||'image/jpeg',dados,ts]);
    rodar('UPDATE conversas SET ultima=?,atualizada=?,lida=0 WHERE id=?',['📎 Comprovante enviado',ts,req.params.id]);
    res.json({ id, ts, ok: true });
});
app.get('/api/conv/:id/arq', (req, res) => res.json(todos('SELECT * FROM arquivos WHERE conv_id=? ORDER BY ts ASC',[req.params.id])));

app.post('/api/calcular', (req, res) => {
    const { distancia, veiculo } = req.body||{};
    const km=parseFloat(distancia)||0, v=veiculo||'moto';
    const p={ moto:{min:15,pkm:1.8}, carro:{min:50,pkm:3.5} };
    const preco = km<=7 ? (p[v]?.min||15) : Math.min(Math.round(km*(p[v]?.pkm||1.8)*100)/100, 500);
    res.json({ distancia: km, valor: preco, veiculo: v });
});

// =============================================================
// HEALTH CHECK
// =============================================================
app.get('/api/health', (req, res) => {
    const nu = um('SELECT COUNT(*) as c FROM usuarios');
    const na = um('SELECT COUNT(*) as c FROM admins');
    const nc = um('SELECT COUNT(*) as c FROM conversas');
    res.json({
        ok: true,
        usuarios:  nu?.c || 0,
        admins:    na?.c || 0,
        conversas: nc?.c || 0,
        mp:        MP_ACCESS_TOKEN ? 'configurado' : 'ausente',
        webhook:   WEBHOOK_URL || 'não configurado',
        banco:     fs.existsSync(DB_FILE) ? `${(fs.statSync(DB_FILE).size/1024).toFixed(1)} KB` : 'novo'
    });
});

// =============================================================
// START
// =============================================================
abrirBanco().then(() => {
    app.listen(PORT, () => {
        console.log('');
        console.log('🚚 N&G Express rodando!');
        console.log(`📡 http://localhost:${PORT}`);
        console.log(`🏥 GET  /api/health`);
        console.log(`👤 POST /api/usuarios/login(.php)`);
        console.log(`📝 POST /api/usuarios/cadastrar(.php)`);
        console.log(`👑 POST /api/admin/login(.php)`);
        console.log(`📋 GET  /api/admin/dados(.php)?aid=ID`);
        console.log(`💳 POST /api/pix/criar`);
        console.log('');
        console.log('💡 Admin:   admin@ngexpress.com.br / admin123');
        console.log('💡 Usuário: gabi.05assis9@gmail.com / Ng142536');
        console.log('');
    });
}).catch(err => { console.error('❌ Falha ao iniciar:', err.message); process.exit(1); });