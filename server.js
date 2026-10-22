require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const https = require("https");
const crypto = require("crypto");
const { v4: uuid } = require("uuid");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const { um, todos, rodar, query, initDb } = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === "production";

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "ng-express-super-secret-key-2026";
const TOKEN_SECRET = process.env.TOKEN_SECRET || SESSION_SECRET;

console.log("🔑 MP_ACCESS_TOKEN:", MP_ACCESS_TOKEN ? "✅ OK" : "❌ FALTANDO");
console.log("🌐 BASE_URL:", BASE_URL);
console.log(
  "🗺️ GOOGLE_MAPS_API_KEY:",
  GOOGLE_MAPS_API_KEY ? "✅ OK" : "❌ FALTANDO",
);

// =============================================================
// PRICING
// =============================================================
const PRICING = {
  cidadePrincipal: "Balneário Camboriú",
  dentroCidadePrincipal: {
    valorBase: 15.0,
    limiteKmBase: 7,
    valorPorKmExcedente: 2.3,
  },
  foraCidadePrincipal: { valorPorKm: 2.3, valorMinimo: 15.0 },
  valorMaximo: 500.0,
};

function normalizarTexto(txt) {
  return (txt || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function calcularPreco(distanciaKm, cidadeDestino) {
  distanciaKm = Math.round(distanciaKm * 10) / 10;
  const ehPrincipal =
    normalizarTexto(cidadeDestino) === normalizarTexto(PRICING.cidadePrincipal);

  let valor = 0;
  if (ehPrincipal) {
    const r = PRICING.dentroCidadePrincipal;
    valor =
      distanciaKm <= r.limiteKmBase
        ? r.valorBase
        : r.valorBase + (distanciaKm - r.limiteKmBase) * r.valorPorKmExcedente;
  } else {
    const r = PRICING.foraCidadePrincipal;
    valor = Math.max(r.valorMinimo, distanciaKm * r.valorPorKm);
  }
  return Math.min(Math.round(valor * 100) / 100, PRICING.valorMaximo);
}

// =============================================================
// UTILITÁRIOS
// =============================================================
const agora = () => Date.now();
const texto = (v, max = 300) =>
  String(v ?? "")
    .trim()
    .slice(0, max);

function limitar(max, janelaMs) {
  const mapa = new Map();
  return (req, res, next) => {
    const agoraMs = Date.now();
    const lista = (mapa.get(req.ip) || []).filter(
      (t) => agoraMs - t < janelaMs,
    );
    if (lista.length >= max)
      return res.status(429).json({
        success: false,
        message: "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
      });
    lista.push(agoraMs);
    mapa.set(req.ip, lista);
    next();
  };
}

// =============================================================
// TOKENS ASSINADOS
// =============================================================
function assinar(payload, ttlMs) {
  const corpo = Buffer.from(
    JSON.stringify({ ...payload, exp: Date.now() + ttlMs }),
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(corpo)
    .digest("base64url");
  return `${corpo}.${sig}`;
}

function verificarToken(token) {
  try {
    const [corpo, sig] = String(token || "").split(".");
    if (!corpo || !sig) return null;
    const esperado = crypto
      .createHmac("sha256", TOKEN_SECRET)
      .update(corpo)
      .digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(esperado);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const p = JSON.parse(Buffer.from(corpo, "base64url").toString());
    if (!p.exp || p.exp < Date.now()) return null;
    return p;
  } catch (_) {
    return null;
  }
}

function lerAuth(req) {
  const h = req.headers.authorization || "";
  if (h.startsWith("Bearer ")) {
    const p = verificarToken(h.slice(7));
    if (p && (p.t === "u" || p.t === "a")) return p;
  }
  if (req.session?.usuario) return { t: "u", id: req.session.usuario.id };
  if (req.session?.admin) return { t: "a", id: req.session.admin.id };
  return null;
}

function exigirUsuario(req, res, next) {
  const a = lerAuth(req);
  if (!a || a.t !== "u")
    return res
      .status(401)
      .json({ success: false, message: "Faça login para continuar" });
  req.uid = a.id;
  next();
}

function exigirAdmin(req, res, next) {
  const a = lerAuth(req);
  if (!a || a.t !== "a")
    return res.status(401).json({ success: false, message: "Acesso negado" });
  req.aid = a.id;
  next();
}

const usuarioPublico = (u) => ({
  id: u.id,
  nome: u.nome,
  email: u.email,
  telefone: u.telefone || "",
});

// =============================================================
// CORS + SESSÃO
// =============================================================
const ORIGENS_OK = [
  "https://ng-express.netlify.app",
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  ...(process.env.EXTRA_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
];

app.set("trust proxy", 1);

app.use((req, res, next) => {
  const origem = req.headers.origin || "";
  res.setHeader(
    "Access-Control-Allow-Origin",
    ORIGENS_OK.includes(origem) ? origem : ORIGENS_OK[0],
  );
  res.setHeader("Vary", "Origin");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: "1mb" }));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: IS_PROD,
      sameSite: IS_PROD ? "none" : "lax",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

// =============================================================
// ARQUIVOS ESTÁTICOS
// =============================================================
const publicDir = path.join(__dirname, "public");
if (fs.existsSync(publicDir)) app.use(express.static(publicDir));
["css", "js", "img"].forEach((pasta) => {
  const p = path.join(__dirname, pasta);
  if (fs.existsSync(p)) app.use(`/${pasta}`, express.static(p));
});

const paginas = ["index", "novo-pedido", "admin", "dashboard"];
paginas.forEach((nome) =>
  app.get(`/${nome}.html`, (req, res) =>
    res.sendFile(path.join(__dirname, `${nome}.html`)),
  ),
);
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

// =============================================================
// GOOGLE MAPS PLATFORM
// =============================================================
function googleRequest(options, bodyObj = null) {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_MAPS_API_KEY) {
      return reject(new Error("GOOGLE_MAPS_API_KEY não configurada no .env"));
    }
    const data = bodyObj ? JSON.stringify(bodyObj) : null;
    const headers = {
      Referer: BASE_URL || "http://localhost:3000",
      ...(options.headers || {}),
    };
    if (data) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(data);
    }
    const req = https.request({ ...options, headers }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw || "{}") });
        } catch (e) {
          reject(
            new Error("Resposta inválida do Google: " + raw.slice(0, 180)),
          );
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () =>
      req.destroy(new Error("Google Maps: tempo esgotado")),
    );
    if (data) req.write(data);
    req.end();
  });
}

function extrairCidadePlaceNew(addressComponents) {
  if (!Array.isArray(addressComponents)) return null;
  const comp = addressComponents.find(
    (c) =>
      c.types?.includes("administrative_area_level_2") ||
      c.types?.includes("locality") ||
      c.types?.includes("sublocality_level_1"),
  );
  return comp?.longText || comp?.shortText || null;
}

function extrairNumeroPlaceNew(addressComponents) {
  if (!Array.isArray(addressComponents)) return "";
  const comp = addressComponents.find((c) =>
    c.types?.includes("street_number"),
  );
  return comp?.shortText || comp?.longText || "";
}

async function geocodificarEndereco(endereco) {
  const resp = await googleRequest(
    {
      hostname: "places.googleapis.com",
      path: "/v1/places:searchText",
      method: "POST",
      headers: {
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask":
          "places.location,places.formattedAddress,places.addressComponents,places.displayName",
      },
    },
    {
      textQuery: endereco,
      languageCode: "pt-BR",
      regionCode: "BR",
      locationBias: {
        circle: {
          center: { latitude: -26.9906, longitude: -48.6347 },
          radius: 50000.0,
        },
      },
    },
  );

  const place = resp.body?.places?.[0];
  if (resp.status === 200 && place?.location) {
    return {
      lat: place.location.latitude,
      lng: place.location.longitude,
      enderecoFormatado:
        place.formattedAddress || place.displayName?.text || endereco,
      cidade: extrairCidadePlaceNew(place.addressComponents),
      numero: extrairNumeroPlaceNew(place.addressComponents),
    };
  }

  const msgErro =
    resp.body?.error?.message ||
    `Endereço não encontrado no Google Maps: ${endereco}`;
  throw new Error(msgErro);
}

async function detalhesPlaceId(placeId) {
  const resp = await googleRequest({
    hostname: "places.googleapis.com",
    path: `/v1/places/${encodeURIComponent(placeId)}?languageCode=pt-BR&regionCode=BR`,
    method: "GET",
    headers: {
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask":
        "id,formattedAddress,location,addressComponents,displayName",
    },
  });

  if (resp.status === 200 && resp.body?.location) {
    return {
      lat: resp.body.location.latitude,
      lng: resp.body.location.longitude,
      endereco: resp.body.formattedAddress || resp.body.displayName?.text || "",
      cidade: extrairCidadePlaceNew(resp.body.addressComponents),
      numero: extrairNumeroPlaceNew(resp.body.addressComponents),
    };
  }
  throw new Error(
    resp.body?.error?.message || "Não foi possível obter detalhes do local",
  );
}

async function geocodificarReversoGoogle(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);

  try {
    const qs = new URLSearchParams({
      latlng: `${latitude},${longitude}`,
      language: "pt-BR",
      region: "br",
      key: GOOGLE_MAPS_API_KEY,
    });
    const geo = await googleRequest({
      hostname: "maps.googleapis.com",
      path: `/maps/api/geocode/json?${qs.toString()}`,
      method: "GET",
    });

    if (
      geo.status === 200 &&
      geo.body.status === "OK" &&
      geo.body.results?.[0]
    ) {
      const r = geo.body.results[0];
      const num =
        r.address_components?.find((c) => c.types.includes("street_number"))
          ?.short_name || "";
      const cid =
        r.address_components?.find(
          (c) =>
            c.types.includes("administrative_area_level_2") ||
            c.types.includes("locality"),
        )?.long_name || "Balneário Camboriú";
      return {
        lat: latitude,
        lng: longitude,
        endereco: r.formatted_address,
        numero: num,
        cidade: cid,
      };
    }
  } catch (_) {}

  const nearby = await googleRequest(
    {
      hostname: "places.googleapis.com",
      path: "/v1/places:searchNearby",
      method: "POST",
      headers: {
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask":
          "places.formattedAddress,places.location,places.addressComponents,places.displayName",
      },
    },
    {
      languageCode: "pt-BR",
      regionCode: "BR",
      maxResultCount: 1,
      rankPreference: "DISTANCE",
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: 150.0,
        },
      },
    },
  );

  const place = nearby.body?.places?.[0];
  if (nearby.status === 200 && place) {
    return {
      lat: latitude,
      lng: longitude,
      endereco:
        place.formattedAddress ||
        place.displayName?.text ||
        `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      numero: extrairNumeroPlaceNew(place.addressComponents),
      cidade:
        extrairCidadePlaceNew(place.addressComponents) || "Balneário Camboriú",
    };
  }

  throw new Error(
    nearby.body?.error?.message ||
      "Não foi possível localizar o endereço no Google Maps.",
  );
}

app.get("/api/enderecos/sugerir", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 3) return res.json({ success: true, sugestoes: [] });

    const autoResp = await googleRequest(
      {
        hostname: "places.googleapis.com",
        path: "/v1/places:autocomplete",
        method: "POST",
        headers: {
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        },
      },
      {
        input: q,
        languageCode: "pt-BR",
        regionCode: "BR",
        includedRegionCodes: ["br"],
        locationBias: {
          circle: {
            center: { latitude: -26.9906, longitude: -48.6347 },
            radius: 50000.0,
          },
        },
      },
    );

    if (autoResp.status === 200 && Array.isArray(autoResp.body?.suggestions)) {
      const sugestoes = autoResp.body.suggestions
        .map((s) => s.placePrediction)
        .filter(Boolean)
        .slice(0, 5)
        .map((p) => ({
          placeId: p.placeId,
          descricao:
            p.text?.text ||
            [
              p.structuredFormat?.mainText?.text,
              p.structuredFormat?.secondaryText?.text,
            ]
              .filter(Boolean)
              .join(" - "),
        }));

      return res.json({ success: true, sugestoes });
    }
    res.json({ success: true, sugestoes: [] });
  } catch (e) {
    res.json({ success: false, sugestoes: [], message: e.message });
  }
});

app.get("/api/enderecos/detalhes", async (req, res) => {
  try {
    const placeId = String(req.query.placeId || "").trim();
    if (!placeId)
      return res
        .status(400)
        .json({ success: false, message: "placeId obrigatório" });
    const dados = await detalhesPlaceId(placeId);
    res.json({ success: true, ...dados });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get("/api/enderecos/reverso", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng)
      return res
        .status(400)
        .json({ success: false, message: "Coordenadas ausentes" });
    const dados = await geocodificarReversoGoogle(lat, lng);
    res.json({ success: true, ...dados });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

function rotaPorModo(origem, destino, modo) {
  return new Promise((resolve, reject) => {
    const corpo = {
      origin: {
        location: { latLng: { latitude: origem.lat, longitude: origem.lng } },
      },
      destination: {
        location: { latLng: { latitude: destino.lat, longitude: destino.lng } },
      },
      travelMode: modo,
      computeAlternativeRoutes: false,
      languageCode: "pt-BR",
      units: "METRIC",
    };
    if (modo === "DRIVE") corpo.routingPreference = "TRAFFIC_AWARE";
    const data = JSON.stringify(corpo);

    const req = https.request(
      {
        hostname: "routes.googleapis.com",
        path: "/directions/v2:computeRoutes",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try {
            const body = JSON.parse(raw);
            if (res.statusCode !== 200 || !body.routes?.[0])
              throw new Error(body.error?.message || "Rota não encontrada");
            const route = body.routes[0];
            const distanciaKm = route.distanceMeters / 1000;
            const duracaoMin = Math.max(
              1,
              Math.round(
                parseInt(String(route.duration).replace("s", ""), 10) / 60,
              ),
            );
            resolve({
              distanciaKm,
              distanciaTexto: `${distanciaKm.toFixed(1)} km`,
              duracaoMin,
              duracaoTexto:
                duracaoMin < 60
                  ? `${duracaoMin} min`
                  : `${Math.floor(duracaoMin / 60)}h ${duracaoMin % 60}min`,
              polyline: route.polyline?.encodedPolyline || "",
              mapsLink: `https://www.google.com/maps/dir/?api=1&origin=${origem.lat},${origem.lng}&destination=${destino.lat},${destino.lng}&travelmode=driving`,
            });
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on("error", reject);
    req.setTimeout(15000, () =>
      req.destroy(new Error("Routes API: tempo esgotado")),
    );
    req.write(data);
    req.end();
  });
}

async function calcularRota(origem, destino, veiculo) {
  const modos = veiculo === "moto" ? ["TWO_WHEELER", "DRIVE"] : ["DRIVE"];
  let ultimoErro;
  for (const modo of modos) {
    try {
      return await rotaPorModo(origem, destino, modo);
    } catch (e) {
      ultimoErro = e;
    }
  }
  throw ultimoErro;
}

// =============================================================
// USUÁRIOS
// =============================================================
app.post(
  "/api/usuarios/cadastrar",
  limitar(10, 10 * 60 * 1000),
  async (req, res) => {
    try {
      const { nome, email, telefone, senha } = req.body || {};
      if (!nome || !email || !telefone || !senha)
        return res.status(400).json({
          success: false,
          message: "Todos os campos são obrigatórios",
        });
      if (String(senha).length < 6)
        return res
          .status(400)
          .json({ success: false, message: "Senha mínimo 6 caracteres" });

      const emailNorm = String(email).toLowerCase().trim();
      const existe = await um("SELECT id FROM usuarios WHERE email = $1", [
        emailNorm,
      ]);
      if (existe)
        return res
          .status(409)
          .json({ success: false, message: "E-mail já cadastrado" });

      const id = uuid();
      const hash = await bcrypt.hash(String(senha), 10);
      await rodar(
        "INSERT INTO usuarios (id,nome,email,telefone,senha_hash,criado) VALUES ($1,$2,$3,$4,$5,$6)",
        [id, texto(nome, 120), emailNorm, texto(telefone, 30), hash, agora()],
      );

      const usuario = {
        id,
        nome: texto(nome, 120),
        email: emailNorm,
        telefone: texto(telefone, 30),
      };
      req.session.usuario = usuario;
      const token = assinar({ t: "u", id }, 7 * 24 * 3600 * 1000);
      req.session.save(() =>
        res.json({
          success: true,
          message: "Cadastro realizado!",
          usuario,
          token,
        }),
      );
    } catch (e) {
      res.status(500).json({ success: false, message: "Erro interno" });
    }
  },
);

app.post(
  "/api/usuarios/login",
  limitar(15, 10 * 60 * 1000),
  async (req, res) => {
    try {
      const { email, senha } = req.body || {};
      if (!email || !senha)
        return res
          .status(400)
          .json({ success: false, message: "E-mail e senha obrigatórios" });

      const u = await um("SELECT * FROM usuarios WHERE email = $1", [
        String(email).toLowerCase().trim(),
      ]);
      const ok = u && (await bcrypt.compare(String(senha), u.senha_hash));
      if (!ok)
        return res
          .status(401)
          .json({ success: false, message: "E-mail ou senha inválidos" });

      const usuario = usuarioPublico(u);
      req.session.usuario = usuario;
      const token = assinar({ t: "u", id: u.id }, 7 * 24 * 3600 * 1000);
      req.session.save(() => res.json({ success: true, usuario, token }));
    } catch (e) {
      res.status(500).json({ success: false, message: "Erro interno" });
    }
  },
);

app.post("/api/usuarios/logout", (req, res) =>
  req.session.destroy(() => res.json({ success: true })),
);

app.get("/api/usuarios/verificar", async (req, res) => {
  try {
    const a = lerAuth(req);
    if (!a || a.t !== "u") return res.json({ logado: false, usuario: null });
    const u = await um(
      "SELECT id,nome,email,telefone FROM usuarios WHERE id = $1",
      [a.id],
    );
    if (!u) return res.json({ logado: false, usuario: null });
    res.json({ logado: true, usuario: usuarioPublico(u) });
  } catch (e) {
    res.status(500).json({ logado: false, usuario: null });
  }
});

// =============================================================
// ROTA E PREÇO
// =============================================================
app.post("/api/rotas/calcular", async (req, res) => {
  try {
    const { coleta, entrega } = req.body || {};
    const veiculo = req.body?.veiculo === "carro" ? "carro" : "moto";
    if (!coleta || !entrega)
      return res
        .status(400)
        .json({ success: false, message: "Informe coleta e entrega" });

    const resolver = async (p) => {
      if (p.lat && p.lng) {
        return {
          lat: Number(p.lat),
          lng: Number(p.lng),
          endereco: p.endereco || `${p.lat}, ${p.lng}`,
          cidade: p.cidade || null,
        };
      }
      if (p.placeId) {
        const det = await detalhesPlaceId(p.placeId);
        return {
          lat: det.lat,
          lng: det.lng,
          endereco: p.endereco || det.endereco,
          cidade: det.cidade || null,
        };
      }
      if (p.endereco) {
        const g = await geocodificarEndereco(p.endereco);
        return {
          lat: g.lat,
          lng: g.lng,
          endereco: g.enderecoFormatado || p.endereco,
          cidade: g.cidade || null,
        };
      }
      return null;
    };

    const origem = await resolver(coleta);
    const destino = await resolver(entrega);
    if (!origem || !destino)
      return res
        .status(400)
        .json({ success: false, message: "Endereços inválidos" });

    const rota = await calcularRota(origem, destino, veiculo);
    let cidadeDestino = destino.cidade;
    if (!cidadeDestino) {
      try {
        const rev = await geocodificarReversoGoogle(destino.lat, destino.lng);
        cidadeDestino = rev.cidade;
      } catch (_) {}
    }

    const valor = calcularPreco(rota.distanciaKm, cidadeDestino);
    const cotacao = assinar(
      {
        t: "cot",
        valor,
        distanciaKm: rota.distanciaKm,
        cidadeDestino: cidadeDestino || "Balneário Camboriú",
        veiculo,
        mapsLink: rota.mapsLink,
      },
      30 * 60 * 1000,
    );

    res.json({
      success: true,
      rota: { ...rota, origem, destino },
      cidadeDestino: cidadeDestino || "Balneário Camboriú",
      valor,
      veiculo,
      cotacao,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// =============================================================
// PIX (MERCADO PAGO)
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
          reject(new Error("Resposta inválida do Mercado Pago"));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(20000, () =>
      req.destroy(new Error("Mercado Pago: tempo esgotado")),
    );
    if (data) req.write(data);
    req.end();
  });
}

const STATUS_MP = {
  approved: "aprovado",
  pending: "pendente",
  in_process: "pendente",
  authorized: "pendente",
  cancelled: "cancelado",
  rejected: "cancelado",
  refunded: "cancelado",
  charged_back: "cancelado",
};

async function sincronizarPagamento(paymentId) {
  const resp = await mpReq(
    "GET",
    `/v1/payments/${encodeURIComponent(paymentId)}`,
    null,
  );
  if (resp.status !== 200) return null;
  const statusMp = resp.body.status;
  const novo = STATUS_MP[statusMp] || "pendente";

  if (novo === "aprovado") {
    await rodar(
      `UPDATE historico_orcamentos
       SET status_pagamento = 'aprovado', data_pagamento = COALESCE(data_pagamento, $1)
       WHERE payment_id = $2 AND status_pagamento <> 'aprovado'`,
      [agora(), String(paymentId)],
    );
  } else {
    await rodar(
      `UPDATE historico_orcamentos SET status_pagamento = $1
       WHERE payment_id = $2 AND status_pagamento <> 'aprovado'`,
      [novo, String(paymentId)],
    );
  }
  return statusMp;
}

app.post(
  "/api/pix/criar",
  exigirUsuario,
  limitar(20, 10 * 60 * 1000),
  async (req, res) => {
    try {
      const { cotacao, pedido } = req.body || {};
      const cot = verificarToken(cotacao);
      if (!cot || cot.t !== "cot")
        return res.status(400).json({
          success: false,
          erro: "Cotação expirada. Volte e calcule o valor novamente.",
        });
      if (!pedido || typeof pedido !== "object")
        return res
          .status(400)
          .json({ success: false, erro: "Dados do pedido ausentes" });

      const u = await um(
        "SELECT id,nome,email,telefone FROM usuarios WHERE id = $1",
        [req.uid],
      );
      if (!u)
        return res
          .status(401)
          .json({ success: false, erro: "Usuário não encontrado" });

      const numeroPedido = `NG${Date.now().toString().slice(-8)}`;
      const partesNome = (u.nome || "Cliente Entrega").trim().split(/\s+/);
      const primeiroNome = partesNome[0] || "Cliente";
      const sobrenome = partesNome.slice(1).join(" ") || "NGExpress";

      const mpBody = {
        transaction_amount: Number(cot.valor),
        description: `Entrega N&G Express #${numeroPedido}`,
        payment_method_id: "pix",
        payer: {
          email: u.email || "cliente@ngexpress.com.br",
          first_name: primeiroNome,
          last_name: sobrenome,
        },
        external_reference: numeroPedido,
      };
      if (BASE_URL.startsWith("https://"))
        mpBody.notification_url = `${BASE_URL}/api/pix/webhook`;

      const resp = await mpReq("POST", "/v1/payments", mpBody);
      const pix = resp.body?.point_of_interaction?.transaction_data;
      if (![200, 201].includes(resp.status) || !pix) {
        return res.status(502).json({
          success: false,
          erro: resp.body?.message || "Não foi possível gerar o PIX agora",
        });
      }

      const cc = pedido.coordsColeta || {};
      const ce = pedido.coordsEntrega || {};
      const coordsColeta = cc.lat && cc.lng ? `${cc.lat},${cc.lng}` : "";
      const coordsEntrega = ce.lat && ce.lng ? `${ce.lat},${ce.lng}` : "";
      const categorias = Array.isArray(pedido.categorias)
        ? pedido.categorias.map((c) => texto(c, 40)).join(", ")
        : texto(pedido.categorias || "", 200);
      const now = agora();

      await rodar(
        `INSERT INTO historico_orcamentos (
          id, usuario_id, numero_pedido, tipo_veiculo, endereco_coleta, endereco_entrega,
          cidade_destino, descricao, valor_total, distancia_km, coords_coleta, coords_entrega,
          maps_link, payment_id, status_pagamento, data_orcamento, criado,
          receptor_nome, receptor_telefone, categorias
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [
          uuid(),
          u.id,
          numeroPedido,
          cot.veiculo,
          texto(pedido.enderecoColeta, 400),
          texto(pedido.enderecoEntrega, 400),
          texto(cot.cidadeDestino, 120),
          texto(pedido.descricao, 500),
          cot.valor,
          Math.round(cot.distanciaKm * 100) / 100,
          coordsColeta,
          coordsEntrega,
          cot.mapsLink || "",
          String(resp.body.id),
          "pendente",
          now,
          now,
          texto(pedido.receptorNome, 120),
          texto(pedido.receptorTelefone, 30),
          categorias,
        ],
      );

      res.json({
        success: true,
        paymentId: String(resp.body.id),
        numeroPedido,
        qrCode: pix.qr_code,
        qrCodeBase64: pix.qr_code_base64,
        valor: resp.body.transaction_amount,
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        erro: "Erro ao gerar o PIX. Tente novamente.",
      });
    }
  },
);

app.get("/api/pix/status/:paymentId", exigirUsuario, async (req, res) => {
  try {
    const id = String(req.params.paymentId);
    let pedido = await um(
      "SELECT * FROM historico_orcamentos WHERE payment_id = $1 AND usuario_id = $2",
      [id, req.uid],
    );
    if (!pedido)
      return res.status(404).json({ success: false, status: "not_found" });

    let status = pedido.status_pagamento === "aprovado" ? "approved" : null;
    if (!status) {
      status = await sincronizarPagamento(id);
      pedido = await um(
        "SELECT * FROM historico_orcamentos WHERE payment_id = $1",
        [id],
      );
      if (pedido?.status_pagamento === "aprovado") status = "approved";
    }
    res.json({ success: true, status: status || "pending", pedido });
  } catch (e) {
    res.status(500).json({ success: false, erro: e.message });
  }
});

// =============================================================
// HISTÓRICO DE ORÇAMENTOS / CORRIDAS DO USUÁRIO
// =============================================================
app.get("/api/orcamentos/historico", exigirUsuario, async (req, res) => {
  try {
    const orcamentos = await todos(
      `SELECT * FROM historico_orcamentos 
       WHERE usuario_id = $1 
       ORDER BY criado DESC`,
      [req.uid],
    );
    res.json({ success: true, orcamentos });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// =============================================================
// START LOCAL E EXPORTAÇÃO SERVERLESS
// =============================================================
if (process.env.NODE_ENV !== "production" && !process.env.NETLIFY) {
  (async () => {
    try {
      await query("SELECT 1");
      console.log("✅ PostgreSQL conectado localmente");
      await initDb();
      app.listen(PORT, () =>
        console.log(`🚚 N&G Express rodando em http://localhost:${PORT}`),
      );
    } catch (err) {
      console.error("❌ Falha local:", err);
    }
  })();
}

module.exports = app;
