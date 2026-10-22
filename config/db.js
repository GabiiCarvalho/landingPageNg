require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("❌ Erro inesperado no pool PG:", err.message);
});

async function query(text, params = []) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const dur = Date.now() - start;
  if (dur > 500) console.log(`🐢 Query lenta (${dur}ms):`, text.slice(0, 80));
  return res;
}

async function um(text, params = []) {
  const r = await query(text, params);
  return r.rows[0] || null;
}

async function todos(text, params = []) {
  const r = await query(text, params);
  return r.rows;
}

async function rodar(text, params = []) {
  return query(text, params);
}

// =============================================================
// AUTO-INIT — cria e atualiza tabelas se não existirem
// =============================================================
async function initDb() {
  console.log("🔧 Verificando tabelas...");

  await query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id VARCHAR(40) PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      telefone TEXT DEFAULT '',
      senha_hash TEXT NOT NULL,
      criado BIGINT
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS admins (
      id VARCHAR(40) PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      criado BIGINT
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS historico_orcamentos (
      id VARCHAR(40) PRIMARY KEY,
      usuario_id VARCHAR(40),
      numero_pedido TEXT,
      tipo_veiculo TEXT DEFAULT 'moto',
      endereco_coleta TEXT DEFAULT '',
      endereco_entrega TEXT DEFAULT '',
      cidade_destino TEXT DEFAULT '',
      descricao TEXT DEFAULT '',
      valor_total NUMERIC(10,2) DEFAULT 0,
      distancia_km NUMERIC(10,2) DEFAULT 0,
      coords_coleta TEXT DEFAULT '',
      coords_entrega TEXT DEFAULT '',
      maps_link TEXT DEFAULT '',
      payment_id TEXT DEFAULT '',
      status_pagamento TEXT DEFAULT 'pendente',
      data_pagamento BIGINT,
      data_orcamento BIGINT,
      criado BIGINT,
      receptor_nome TEXT DEFAULT '',
      receptor_telefone TEXT DEFAULT '',
      categorias TEXT DEFAULT ''
    )
  `);

  // Garante que colunas novas existam em tabelas antigas já criadas
  await query(
    `ALTER TABLE historico_orcamentos ADD COLUMN IF NOT EXISTS categorias TEXT DEFAULT ''`,
  );
  await query(
    `ALTER TABLE historico_orcamentos ADD COLUMN IF NOT EXISTS receptor_nome TEXT DEFAULT ''`,
  );
  await query(
    `ALTER TABLE historico_orcamentos ADD COLUMN IF NOT EXISTS receptor_telefone TEXT DEFAULT ''`,
  );

  await query(`
    CREATE TABLE IF NOT EXISTS conversas (
      id VARCHAR(60) PRIMARY KEY,
      nome TEXT DEFAULT '', whatsapp TEXT DEFAULT '',
      user_type TEXT DEFAULT '', atendente TEXT DEFAULT '',
      aberta INTEGER DEFAULT 1, lida INTEGER DEFAULT 0, arquivada INTEGER DEFAULT 0,
      valor NUMERIC(10,2) DEFAULT 0, pix TEXT DEFAULT '', mp_payment_id TEXT DEFAULT '',
      aguard_pag INTEGER DEFAULT 0, pag_conf INTEGER DEFAULT 0,
      coleta_cidade TEXT DEFAULT '', coleta_end TEXT DEFAULT '',
      entrega_cidade TEXT DEFAULT '', entrega_end TEXT DEFAULT '',
      dest_nome TEXT DEFAULT '', dest_tel TEXT DEFAULT '',
      motoboy_regiao TEXT DEFAULT '', ultima TEXT DEFAULT '',
      distancia_km NUMERIC(10,2) DEFAULT 0, veiculo TEXT DEFAULT 'moto',
      criada BIGINT, atualizada BIGINT
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS msgs (
      id VARCHAR(40) PRIMARY KEY,
      conv_id VARCHAR(60),
      tipo TEXT,
      texto TEXT DEFAULT '',
      atendente TEXT DEFAULT '',
      ts BIGINT
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS arquivos (
      id VARCHAR(40) PRIMARY KEY,
      conv_id VARCHAR(60),
      nome TEXT DEFAULT '',
      mime TEXT DEFAULT '',
      dados TEXT DEFAULT '',
      ts BIGINT
    )
  `);

  await query(
    `CREATE INDEX IF NOT EXISTS idx_orc_usuario ON historico_orcamentos(usuario_id)`,
  );
  await query(
    `CREATE INDEX IF NOT EXISTS idx_orc_numero ON historico_orcamentos(numero_pedido)`,
  );
  await query(`CREATE INDEX IF NOT EXISTS idx_msgs_conv ON msgs(conv_id)`);

  console.log("✅ Tabelas verificadas");
}

module.exports = { pool, query, um, todos, rodar, initDb };
