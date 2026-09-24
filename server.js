require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const https = require("https");
const { v4: uuid } = require("uuid");
const bcrypt = require("bcryptjs");
const { um, todos, rodar, query, initDb } = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

console.log(
  "🔑 MP_ACCESS_TOKEN:",
  MP_ACCESS_TOKEN ? "✅ OK" : "❌ NÃO CONFIGURADO",
);
console.log(
  "🔐 MP_WEBHOOK_SECRET:",
  MP_WEBHOOK_SECRET ? "✅ OK" : "❌ NÃO CONFIGURADO",
);
console.log("🌐 BASE_URL:", BASE_URL);
console.log(
  "🐘 DATABASE_URL:",
  process.env.DATABASE_URL ? "✅ OK" : "❌ NÃO CONFIGURADO",
);

function isValidWebhookUrl(url) {
  try {
    const p = new URL(url);
    return p.protocol === "https:";
  } catch {
    return false;
  }
}
const WEBHOOK_URL = isValidWebhookUrl(`${BASE_URL}/api/pix/webhook`)
  ? `${BASE_URL}/api/pix/webhook`
  : null;
console.log("🔗 Webhook URL:", WEBHOOK_URL || "❌ não configurado");

// =============================================================
// CORS
// =============================================================
const ORIGENS_OK = [
  "https://ng-express.netlify.app",
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

app.use((req, res, next) => {
  const origem = req.headers.origin || "";
  if (ORIGENS_OK.includes(origem)) {
    res.setHeader("Access-Control-Allow-Origin", origem);
    res.setHeader("Vary", "Origin");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: "25mb" }));

const publicDir = path.join(__dirname, "public");
if (fs.existsSync(publicDir)) app.use(express.static(publicDir));
app.use(express.static(__dirname, { index: false }));

app.use((req, res, next) => {
  if (req.path.endsWith(".php")) {
    const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    req.url = req.path.replace(/\.php$/, "") + qs;
  }
  next();
});

function agora() {
  return Date.now();
}

// =============================================================
// MERCADO PAGO
// =============================================================
function mpReq(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: "api.mercadopago.com",
      path: endpoint,
      method,
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": uuid(),
      },
    };
    if (data) opts.headers["Content-Length"] = Buffer.byteLength(data);
    const req = https.request(opts, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch (e) {
          reject(new Error("MP resposta inválida: " + raw.slice(0, 200)));
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

// =============================================================
// PÁGINAS
// =============================================================
app.get("/", (req, res) => {
  const f = fs.existsSync(path.join(publicDir, "chatbot-cliente.html"))
    ? path.join(publicDir, "chatbot-cliente.html")
    : path.join(__dirname, "index.html");
  res.sendFile(f);
});
app.get("/painel", (req, res) => {
  const f = path.join(__dirname, "painel-atendentes.html");
  fs.existsSync(f) ? res.sendFile(f) : res.status(404).send("Não encontrado");
});

// =============================================================
// USUÁRIOS
// =============================================================
app.post("/api/usuarios/cadastrar", async (req, res) => {
  try {
    const { nome, email, telefone, senha } = req.body || {};
    if (!nome || !email || !telefone || !senha)
      return res
        .status(400)
        .json({ success: false, message: "Todos os campos são obrigatórios" });
    if (senha.length < 6)
      return res
        .status(400)
        .json({ success: false, message: "Senha mínimo 6 caracteres" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res
        .status(400)
        .json({ success: false, message: "E-mail inválido" });

    const existe = await um("SELECT id FROM usuarios WHERE email = $1", [
      email.toLowerCase().trim(),
    ]);
    if (existe)
      return res
        .status(409)
        .json({ success: false, message: "E-mail já cadastrado" });

    const id = uuid(),
      hash = await bcrypt.hash(senha, 10);
    await rodar(
      "INSERT INTO usuarios (id,nome,email,telefone,senha_hash,criado) VALUES ($1,$2,$3,$4,$5,$6)",
      [
        id,
        nome.trim(),
        email.toLowerCase().trim(),
        String(telefone).trim(),
        hash,
        agora(),
      ],
    );
    res.json({
      success: true,
      message: "Cadastro realizado!",
      usuario: {
        id,
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        telefone: String(telefone).trim(),
      },
    });
  } catch (e) {
    console.error("Erro cadastro:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post("/api/usuarios/login", async (req, res) => {
  try {
    const { email, senha } = req.body || {};
    if (!email || !senha)
      return res
        .status(400)
        .json({ success: false, message: "E-mail e senha obrigatórios" });

    const u = await um("SELECT * FROM usuarios WHERE email = $1", [
      email.toLowerCase().trim(),
    ]);
    if (!u)
      return res
        .status(401)
        .json({ success: false, message: "E-mail ou senha inválidos" });

    const ok = await bcrypt.compare(senha, u.senha_hash);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, message: "E-mail ou senha inválidos" });

    res.json({
      success: true,
      usuario: {
        id: u.id,
        nome: u.nome,
        email: u.email,
        telefone: u.telefone || "",
      },
    });
  } catch (e) {
    console.error("Erro login:", e.message);
    res.status(500).json({ success: false, message: "Erro interno" });
  }
});

app.post("/api/usuarios/logout", (req, res) => res.json({ success: true }));
app.get("/api/usuarios/verificar", (req, res) => res.json({ logado: false }));

app.post("/api/usuarios/atualizar", async (req, res) => {
  try {
    const { id, nome, telefone, senha } = req.body || {};
    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "id obrigatório" });

    const campos = [],
      vals = [];
    let i = 1;
    if (nome) {
      campos.push(`nome = $${i++}`);
      vals.push(nome.trim());
    }
    if (telefone) {
      campos.push(`telefone = $${i++}`);
      vals.push(String(telefone).trim());
    }
    if (senha?.length >= 6) {
      campos.push(`senha_hash = $${i++}`);
      vals.push(await bcrypt.hash(senha, 10));
    }
    if (campos.length) {
      vals.push(id);
      await rodar(
        `UPDATE usuarios SET ${campos.join(", ")} WHERE id = $${i}`,
        vals,
      );
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// =============================================================
// ADMIN
// =============================================================
app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, senha } = req.body || {};
    if (!email || !senha)
      return res
        .status(400)
        .json({ success: false, message: "E-mail e senha obrigatórios" });

    const a = await um("SELECT * FROM admins WHERE email = $1", [
      email.toLowerCase().trim(),
    ]);
    if (!a)
      return res
        .status(401)
        .json({ success: false, message: "E-mail ou senha inválidos" });

    const ok = await bcrypt.compare(senha, a.senha_hash);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, message: "E-mail ou senha inválidos" });

    res.json({
      success: true,
      admin: { id: a.id, nome: a.nome, email: a.email },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post("/api/admin/logout", (req, res) => res.json({ success: true }));

app.get("/api/admin/dados", async (req, res) => {
  try {
    let aid = req.query.aid;
    if (!aid) {
      const auth = req.headers.authorization || "";
      if (auth.startsWith("Bearer ")) aid = auth.slice(7).trim();
    }
    if (!aid || aid === "undefined" || aid === "null")
      return res
        .status(401)
        .json({ success: false, message: "Acesso negado: aid não informado" });

    const adm = await um("SELECT id FROM admins WHERE id = $1", [aid]);
    if (!adm)
      return res.status(401).json({
        success: false,
        message: "Acesso negado: admin não encontrado",
      });

    const nCorreidas = await um(
      "SELECT COUNT(*)::int AS c FROM historico_orcamentos",
    );
    const nFaturado = await um(
      "SELECT COALESCE(SUM(valor_total), 0)::numeric AS s FROM historico_orcamentos",
    );
    const nUsuarios = await um("SELECT COUNT(*)::int AS c FROM usuarios");
    const porVeiculo = await todos(
      `SELECT tipo_veiculo, COUNT(*)::int AS total FROM historico_orcamentos GROUP BY tipo_veiculo`,
    );
    const corridas = await todos(`
            SELECT h.id, h.numero_pedido, h.tipo_veiculo,
                   h.endereco_coleta, h.endereco_entrega, h.cidade_destino,
                   h.valor_total, h.status_pagamento AS status, h.data_orcamento,
                   h.distancia_km, h.maps_link,
                   u.nome AS usuario_nome, u.email AS usuario_email, u.telefone AS usuario_telefone
            FROM historico_orcamentos h
            LEFT JOIN usuarios u ON u.id = h.usuario_id
            ORDER BY COALESCE(h.data_orcamento, h.criado) DESC LIMIT 50`);
    const topUsuarios = await todos(`
            SELECT u.nome, u.email, u.telefone,
                   COUNT(h.id)::int AS total_pedidos,
                   COALESCE(SUM(h.valor_total), 0)::numeric AS total_gasto
            FROM usuarios u
            LEFT JOIN historico_orcamentos h ON h.usuario_id = u.id
            GROUP BY u.id, u.nome, u.email, u.telefone
            ORDER BY total_pedidos DESC LIMIT 10`);

    res.json({
      success: true,
      totalCorridas: nCorreidas?.c || 0,
      totalFaturado: parseFloat(nFaturado?.s || 0),
      totalUsuarios: nUsuarios?.c || 0,
      porVeiculo,
      corridas: corridas.map((c) => ({
        ...c,
        data_orcamento: c.data_orcamento
          ? new Date(Number(c.data_orcamento)).toISOString()
          : null,
      })),
      topUsuarios,
    });
  } catch (e) {
    console.error("Erro admin/dados:", e.message);
    res.status(500).json({
      success: false,
      message: "Erro ao carregar dados: " + e.message,
    });
  }
});

// =============================================================
// ORÇAMENTOS
// =============================================================
app.post("/api/orcamentos/salvar", async (req, res) => {
  try {
    const {
      usuario_id,
      numero_pedido,
      tipo_veiculo,
      endereco_coleta,
      endereco_entrega,
      cidade_destino,
      descricao,
      valor_total,
      distancia_km,
      coords_coleta,
      coords_entrega,
      maps_link,
    } = req.body || {};

    if (!usuario_id)
      return res
        .status(400)
        .json({ success: false, message: "usuario_id obrigatório" });

    const id = uuid(),
      now = agora();

    // Coordenadas: aceita {lat,lng} ou "lat,lng"
    const coordsC = coords_coleta
      ? typeof coords_coleta === "string"
        ? coords_coleta
        : `${coords_coleta.lat},${coords_coleta.lng}`
      : "";
    const coordsE = coords_entrega
      ? typeof coords_entrega === "string"
        ? coords_entrega
        : `${coords_entrega.lat},${coords_entrega.lng}`
      : "";

    // Auto-gera maps_link se não vier
    let mapsLinkFinal = maps_link || "";
    if (!mapsLinkFinal && coordsC && coordsE) {
      mapsLinkFinal =
        "https://www.google.com/maps/dir/?api=1" +
        "&origin=" +
        encodeURIComponent(coordsC) +
        "&destination=" +
        encodeURIComponent(coordsE) +
        "&travelmode=driving";
    }

    await rodar(
      `INSERT INTO historico_orcamentos
            (id, usuario_id, numero_pedido, tipo_veiculo,
             endereco_coleta, endereco_entrega, cidade_destino,
             descricao, valor_total, distancia_km,
             coords_coleta, coords_entrega, maps_link,
             data_orcamento, criado)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        id,
        usuario_id,
        numero_pedido || `NG${Date.now().toString().slice(-6)}`,
        tipo_veiculo || "moto",
        endereco_coleta || "",
        endereco_entrega || "",
        cidade_destino || "",
        descricao || "",
        parseFloat(valor_total) || 0,
        parseFloat(distancia_km) || 0,
        coordsC,
        coordsE,
        mapsLinkFinal,
        now,
        now,
      ],
    );

    console.log(
      `✅ Pedido salvo: #${numero_pedido} | ${cidade_destino} | R$ ${valor_total} | maps: ${mapsLinkFinal ? "sim" : "não"}`,
    );
    res.json({ success: true, id, mapsLink: mapsLinkFinal });
  } catch (e) {
    console.error("Erro salvar orçamento:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get("/api/orcamentos/historico", async (req, res) => {
  try {
    const uid = req.query.uid;
    if (!uid)
      return res
        .status(400)
        .json({ success: false, message: "uid obrigatório" });
    const orcamentos = await todos(
      "SELECT * FROM historico_orcamentos WHERE usuario_id = $1 ORDER BY criado DESC",
      [uid],
    );
    res.json({ success: true, orcamentos });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get("/api/orcamentos/maps/:numeroPedido", async (req, res) => {
  try {
    const o = await um(
      "SELECT numero_pedido, endereco_coleta, endereco_entrega, cidade_destino, distancia_km, maps_link, coords_coleta, coords_entrega FROM historico_orcamentos WHERE numero_pedido = $1",
      [req.params.numeroPedido],
    );
    if (!o)
      return res
        .status(404)
        .json({ success: false, message: "Pedido não encontrado" });
    res.json({ success: true, pedido: o });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get("/api/orcamentos/:uid", async (req, res) => {
  try {
    const orcamentos = await todos(
      "SELECT * FROM historico_orcamentos WHERE usuario_id = $1 ORDER BY criado DESC",
      [req.params.uid],
    );
    res.json({ success: true, orcamentos });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// =============================================================
// PIX
// =============================================================
app.post("/api/pix/criar", async (req, res) => {
  try {
    const { convId, valor, nomeCliente, descricao } = req.body || {};
    if (!valor || parseFloat(valor) <= 0)
      return res.status(400).json({ success: false, erro: "Valor inválido" });
    if (!MP_ACCESS_TOKEN)
      return res
        .status(503)
        .json({ success: false, erro: "MP_ACCESS_TOKEN não configurado" });

    const convIdFinal = convId || `pedido_${Date.now()}`;
    const mpBody = {
      transaction_amount: parseFloat(parseFloat(valor).toFixed(2)),
      description:
        descricao ||
        `Entrega N&G Express #${convIdFinal.slice(-6).toUpperCase()}`,
      payment_method_id: "pix",
      payer: {
        email: "cliente@ngexpress.com.br",
        first_name: (nomeCliente || "Cliente").split(" ")[0],
        last_name:
          (nomeCliente || "Cliente").split(" ").slice(1).join(" ") ||
          "NGExpress",
        identification: { type: "CPF", number: "00000000000" },
      },
      external_reference: convIdFinal,
    };
    if (WEBHOOK_URL) mpBody.notification_url = WEBHOOK_URL;

    let resp = await mpReq("POST", "/v1/payments", mpBody);
    if (
      resp.status !== 201 &&
      resp.body?.cause?.[0]?.code === 4020 &&
      mpBody.notification_url
    ) {
      delete mpBody.notification_url;
      resp = await mpReq("POST", "/v1/payments", mpBody);
    }
    if (resp.status !== 201)
      return res
        .status(502)
        .json({ success: false, erro: "Erro MP", detalhe: resp.body });

    const pix = resp.body.point_of_interaction?.transaction_data;
    if (!pix?.qr_code)
      return res
        .status(502)
        .json({ success: false, erro: "MP não retornou QR Code" });

    const existe = await um("SELECT id FROM conversas WHERE id = $1", [
      convIdFinal,
    ]);
    if (!existe)
      await rodar(
        "INSERT INTO conversas (id,criada,atualizada) VALUES ($1,$2,$3)",
        [convIdFinal, agora(), agora()],
      );

    await rodar(
      "UPDATE conversas SET mp_payment_id=$1, pix=$2, aguard_pag=1, valor=$3, atualizada=$4 WHERE id=$5",
      [
        String(resp.body.id),
        pix.qr_code,
        parseFloat(valor),
        agora(),
        convIdFinal,
      ],
    );

    res.json({
      success: true,
      paymentId: resp.body.id,
      qrCode: pix.qr_code,
      qrCodeBase64: pix.qr_code_base64 || null,
      valor: resp.body.transaction_amount,
    });
  } catch (e) {
    console.error("Erro pix/criar:", e.message);
    res.status(500).json({ success: false, erro: e.message });
  }
});

app.get("/api/pix/status/:convId", async (req, res) => {
  try {
    const c = await um("SELECT * FROM conversas WHERE id = $1", [
      req.params.convId,
    ]);
    if (!c) return res.status(404).json({ erro: "não encontrada" });
    if (!c.mp_payment_id) return res.json({ status: "sem_cobranca" });

    const resp = await mpReq("GET", `/v1/payments/${c.mp_payment_id}`, null);
    if (resp.status !== 200) return res.status(502).json({ erro: "Erro MP" });

    if (resp.body.status === "approved" && !c.pag_conf)
      await rodar(
        "UPDATE conversas SET pag_conf=1, aguard_pag=0, atualizada=$1 WHERE id=$2",
        [agora(), req.params.convId],
      );

    res.json({ status: resp.body.status, valor: resp.body.transaction_amount });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.post("/api/pix/webhook", async (req, res) => {
  res.sendStatus(200);
  try {
    const { type, data } = req.body || {};
    if (type !== "payment" || !data?.id) return;

    const resp = await mpReq("GET", `/v1/payments/${data.id}`, null);
    if (resp.status !== 200 || resp.body.status !== "approved") return;

    const convId = resp.body.external_reference;
    if (!convId) return;

    const c = await um("SELECT * FROM conversas WHERE id = $1", [convId]);
    if (!c || c.pag_conf) return;

    await rodar(
      "UPDATE conversas SET pag_conf=1, aguard_pag=0, lida=0, atualizada=$1 WHERE id=$2",
      [agora(), convId],
    );

    const ts = agora();
    await rodar(
      "INSERT INTO msgs (id,conv_id,tipo,texto,atendente,ts) VALUES ($1,$2,$3,$4,$5,$6)",
      [
        uuid(),
        convId,
        "atendente",
        "✅ Pagamento confirmado! Em breve seu pedido será atendido. 🚚",
        "Sistema",
        ts,
      ],
    );

    await rodar("UPDATE conversas SET ultima=$1, atualizada=$2 WHERE id=$3", [
      "✅ Pagamento confirmado!",
      ts,
      convId,
    ]);

    await rodar(
      `UPDATE historico_orcamentos SET status_pagamento='aprovado', data_pagamento=$1, payment_id=$2 WHERE numero_pedido=$3`,
      [agora(), String(data.id), convId],
    );
  } catch (e) {
    console.error("❌ Webhook:", e.message);
  }
});

// =============================================================
// CONVERSAS (chatbot)
// =============================================================
async function montarConversa(c) {
  if (!c) return null;
  const msgs = await todos(
    "SELECT * FROM msgs WHERE conv_id = $1 ORDER BY ts ASC",
    [c.id],
  );
  const arqs = await todos(
    "SELECT id,nome,mime,dados,ts FROM arquivos WHERE conv_id = $1 ORDER BY ts ASC",
    [c.id],
  );
  return {
    id: c.id,
    aberta: !!c.aberta,
    lida: !!c.lida,
    arquivada: !!c.arquivada,
    ultima: c.ultima,
    ts: c.atualizada,
    msgs: msgs.map((m) => ({
      id: m.id,
      tipo: m.tipo,
      texto: m.texto,
      atendente: m.atendente,
      ts: m.ts,
    })),
    arquivos: arqs.map((a) => ({
      id: a.id,
      nome: a.nome,
      mime: a.mime,
      dados: a.dados,
      ts: a.ts,
    })),
    info: {
      nome: c.nome,
      whatsapp: c.whatsapp,
      userType: c.user_type,
      atendenteAtivo: c.atendente,
      valor: c.valor,
      pixPayload: c.pix,
      mpPaymentId: c.mp_payment_id,
      aguardandoConfirmacao: !!c.aguard_pag,
      pagamentoConfirmado: !!c.pag_conf,
      distancia: c.distancia_km,
      veiculo: c.veiculo,
      coleta: { cidade: c.coleta_cidade, endereco: c.coleta_end },
      entrega: { cidade: c.entrega_cidade, endereco: c.entrega_end },
      destinatario: { nome: c.dest_nome, tel: c.dest_tel },
      motoboy: { regiao: c.motoboy_regiao },
    },
  };
}

app.post("/api/conv", async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ erro: "id obrigatório" });

    let c = await um("SELECT * FROM conversas WHERE id = $1", [id]);
    if (!c) {
      await rodar(
        "INSERT INTO conversas (id,criada,atualizada) VALUES ($1,$2,$3)",
        [id, agora(), agora()],
      );
      c = await um("SELECT * FROM conversas WHERE id = $1", [id]);
    }
    res.json(await montarConversa(c));
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.get("/api/conv", async (req, res) => {
  try {
    const lista = await todos(
      "SELECT * FROM conversas WHERE arquivada=0 ORDER BY atualizada DESC",
    );
    const resultado = await Promise.all(lista.map(montarConversa));
    res.json(resultado);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.get("/api/conv/:id", async (req, res) => {
  try {
    const c = await um("SELECT * FROM conversas WHERE id = $1", [
      req.params.id,
    ]);
    if (!c) return res.status(404).json({ erro: "não encontrada" });
    res.json(await montarConversa(c));
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.patch("/api/conv/:id", async (req, res) => {
  try {
    const { id } = req.params,
      b = req.body || {};
    const c = await um("SELECT * FROM conversas WHERE id = $1", [id]);
    if (!c) return res.status(404).json({ erro: "não encontrada" });

    const campos = [],
      vals = [];
    let i = 1;
    const add = (col, val) => {
      if (val !== undefined) {
        campos.push(`${col} = $${i++}`);
        vals.push(val);
      }
    };

    add("nome", b.nome);
    add("whatsapp", b.whatsapp);
    add("user_type", b.userType);
    add("atendente", b.atendente);
    add("aberta", b.aberta !== undefined ? (b.aberta ? 1 : 0) : undefined);
    add("lida", b.lida !== undefined ? (b.lida ? 1 : 0) : undefined);
    add(
      "arquivada",
      b.arquivada !== undefined ? (b.arquivada ? 1 : 0) : undefined,
    );
    add("valor", b.valor);
    add("pix", b.pixPayload);
    add("mp_payment_id", b.mpPaymentId);
    add(
      "aguard_pag",
      b.aguardandoConfirmacao !== undefined
        ? b.aguardandoConfirmacao
          ? 1
          : 0
        : undefined,
    );
    add(
      "pag_conf",
      b.pagamentoConfirmado !== undefined
        ? b.pagamentoConfirmado
          ? 1
          : 0
        : undefined,
    );
    add("coleta_cidade", b.coleta?.cidade);
    add("coleta_end", b.coleta?.endereco);
    add("entrega_cidade", b.entrega?.cidade);
    add("entrega_end", b.entrega?.endereco);
    add("dest_nome", b.destinatario?.nome);
    add("dest_tel", b.destinatario?.tel);
    add("motoboy_regiao", b.motoboy?.regiao);
    add("distancia_km", b.distancia);
    add("veiculo", b.veiculo);
    add("ultima", b.ultima);

    if (campos.length) {
      campos.push(`atualizada = $${i++}`);
      vals.push(agora());
      vals.push(id);
      await rodar(
        `UPDATE conversas SET ${campos.join(", ")} WHERE id = $${i}`,
        vals,
      );
    }
    res.json(
      await montarConversa(
        await um("SELECT * FROM conversas WHERE id = $1", [id]),
      ),
    );
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.delete("/api/conv/:id", async (req, res) => {
  try {
    await rodar("DELETE FROM msgs WHERE conv_id = $1", [req.params.id]);
    await rodar("DELETE FROM arquivos WHERE conv_id = $1", [req.params.id]);
    await rodar("DELETE FROM conversas WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.get("/api/historico", async (req, res) => {
  try {
    const { nome, whatsapp, excluir } = req.query;
    if (!nome || !whatsapp) return res.json(null);
    const waNorm = whatsapp.replace(/\D/g, "");
    const lista = await todos(
      `SELECT * FROM conversas
             WHERE id != $1 AND LOWER(TRIM(nome)) = LOWER(TRIM($2)) AND arquivada = 0
             ORDER BY atualizada DESC`,
      [excluir || "", nome],
    );
    const match = lista.find(
      (c) =>
        (c.whatsapp || "").replace(/\D/g, "") === waNorm &&
        (c.coleta_cidade || c.entrega_cidade),
    );
    res.json(match ? await montarConversa(match) : null);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.post("/api/conv/:id/msgs", async (req, res) => {
  try {
    const { tipo, texto, atendente } = req.body || {};
    const conv_id = req.params.id,
      id = uuid(),
      ts = agora();

    await rodar(
      "INSERT INTO msgs (id,conv_id,tipo,texto,atendente,ts) VALUES ($1,$2,$3,$4,$5,$6)",
      [id, conv_id, tipo, texto || "", atendente || "", ts],
    );

    if (tipo === "user")
      await rodar(
        "UPDATE conversas SET ultima=$1, atualizada=$2, lida=0 WHERE id=$3",
        [(texto || "").substring(0, 80), ts, conv_id],
      );
    else
      await rodar("UPDATE conversas SET ultima=$1, atualizada=$2 WHERE id=$3", [
        (texto || "").substring(0, 80),
        ts,
        conv_id,
      ]);

    res.json({ id, ts, ok: true });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.post("/api/conv/:id/arq", async (req, res) => {
  try {
    const { nome, mime, dados } = req.body || {};
    if (!dados) return res.status(400).json({ erro: "dados obrigatório" });

    const id = uuid(),
      ts = agora();
    await rodar(
      "INSERT INTO arquivos (id,conv_id,nome,mime,dados,ts) VALUES ($1,$2,$3,$4,$5,$6)",
      [id, req.params.id, nome || "arquivo", mime || "image/jpeg", dados, ts],
    );
    await rodar(
      "UPDATE conversas SET ultima=$1, atualizada=$2, lida=0 WHERE id=$3",
      ["📎 Comprovante enviado", ts, req.params.id],
    );

    res.json({ id, ts, ok: true });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.get("/api/conv/:id/arq", async (req, res) => {
  try {
    const arqs = await todos(
      "SELECT * FROM arquivos WHERE conv_id = $1 ORDER BY ts ASC",
      [req.params.id],
    );
    res.json(arqs);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.post("/api/calcular", (req, res) => {
  const { distancia, veiculo } = req.body || {};
  const km = parseFloat(distancia) || 0,
    v = veiculo || "moto";
  const p = { moto: { min: 15, pkm: 1.8 }, carro: { min: 50, pkm: 3.5 } };
  const preco =
    km <= 7
      ? p[v]?.min || 15
      : Math.min(Math.round(km * (p[v]?.pkm || 1.8) * 100) / 100, 500);
  res.json({ distancia: km, valor: preco, veiculo: v });
});

// =============================================================
// HEALTH CHECK
// =============================================================
app.get("/api/health", async (req, res) => {
  try {
    const nu = await um("SELECT COUNT(*)::int AS c FROM usuarios");
    const na = await um("SELECT COUNT(*)::int AS c FROM admins");
    const nc = await um("SELECT COUNT(*)::int AS c FROM conversas");
    res.json({
      ok: true,
      banco: "postgresql",
      usuarios: nu?.c || 0,
      admins: na?.c || 0,
      conversas: nc?.c || 0,
      mp: MP_ACCESS_TOKEN ? "configurado" : "ausente",
      webhook: WEBHOOK_URL || "não configurado",
    });
  } catch (e) {
    res.status(500).json({ ok: false, erro: e.message });
  }
});

// =============================================================
// START
// =============================================================
(async () => {
  try {
    // Testa conexão
    await query("SELECT 1");
    console.log("✅ PostgreSQL conectado");

    // Cria tabelas
    await initDb();

    // Admin padrão
    const adm = await um("SELECT id FROM admins WHERE email = $1", [
      "admin@ngexpress.com.br",
    ]);
    if (!adm) {
      const h = await bcrypt.hash("admin123", 10);
      await rodar(
        "INSERT INTO admins (id,nome,email,senha_hash,criado) VALUES ($1,$2,$3,$4,$5)",
        [uuid(), "Administrador", "admin@ngexpress.com.br", h, agora()],
      );
      console.log("✅ Admin criado: admin@ngexpress.com.br / admin123");
    }

    app.listen(PORT, () => {
      console.log("");
      console.log("🚚 N&G Express rodando!");
      console.log(`📡 http://localhost:${PORT}`);
      console.log(`🏥 GET  /api/health`);
      console.log(`🐘 Banco: PostgreSQL (Neon)`);
      console.log("");
      console.log("💡 Admin: admin@ngexpress.com.br / admin123");
      console.log("");
    });
  } catch (err) {
    console.error("❌ Falha ao iniciar:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
