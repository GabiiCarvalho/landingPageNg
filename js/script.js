document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 N&G EXPRESS iniciado (100% Google Maps)!");

  const API_BASE_URL = (
    window.API_BASE_URL || "http://localhost:3000/api"
  ).replace(/\/$/, "");

  let googleMap = null;
  let routePolyline = null;
  let markers = { coleta: null, entrega: null };

  window.orcamentoAtual = null;
  const salvoCache = sessionStorage.getItem("ng_orcamento_atual");
  if (salvoCache) {
    try {
      window.orcamentoAtual = JSON.parse(salvoCache);
      if (window.orcamentoAtual && window.orcamentoAtual.valor) {
        const valEl = document.getElementById("valor-final");
        if (valEl)
          valEl.textContent = formatarMoeda(window.orcamentoAtual.valor);
      }
    } catch (e) {}
  }

  window.coordenadasCache = { coleta: null, entrega: null };

  // =============================================
  // UTILITÁRIOS E AUTENTICAÇÃO
  // =============================================
  function formatarMoeda(v) {
    return `R$ ${Number(v || 0)
      .toFixed(2)
      .replace(".", ",")}`;
  }

  function getAuthHeaders(extra = {}) {
    const token =
      localStorage.getItem("ng_token") || sessionStorage.getItem("ng_token");
    const headers = { "Content-Type": "application/json", ...extra };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }

  function mostrarToast(msg, tipo = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${tipo}`;
    const icone =
      tipo === "success"
        ? "check-circle"
        : tipo === "warning"
          ? "exclamation-triangle"
          : "exclamation-circle";
    toast.innerHTML = `<i class="bi bi-${icone}"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.4s";
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }
  window.mostrarToast = mostrarToast;

  const yearEl = document.getElementById("currentYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const mobileBtn = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");
  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }

  // =============================================
  // MODAIS, LOGIN E CADASTRO
  // =============================================
  window.fecharModal = (id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  };

  window.abrirModalLogin = () => {
    window.fecharModal("cadastro-modal");
    const emailSalvo = localStorage.getItem("ng_lembrar_email");
    const inputEmail = document.getElementById("login-email");
    const chkLembrar = document.getElementById("lembrar-email");
    if (emailSalvo && inputEmail) {
      inputEmail.value = emailSalvo;
      if (chkLembrar) chkLembrar.checked = true;
    }
    const modal = document.getElementById("login-modal");
    if (modal) modal.style.display = "flex";
  };

  window.abrirModalCadastro = () => {
    window.fecharModal("login-modal");
    const modal = document.getElementById("cadastro-modal");
    if (modal) modal.style.display = "flex";
  };

  window.fazerLogin = async function (event) {
    event.preventDefault();
    const email = document.getElementById("login-email")?.value.trim();
    const senha = document.getElementById("login-senha")?.value;
    const lembrar = document.getElementById("lembrar-email")?.checked;
    const btn = event.target.querySelector('button[type="submit"]');
    const txtOriginal = btn ? btn.innerHTML : "Entrar";

    if (!email || !senha) {
      return mostrarToast("Preencha e-mail e senha.", "error");
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner spinner-sm"></span> Entrando...';
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, senha }),
      });
      const data = await resp.json();

      if (!resp.ok || !data.success) {
        throw new Error(data.message || "E-mail ou senha inválidos");
      }

      if (lembrar) localStorage.setItem("ng_lembrar_email", email);
      else localStorage.removeItem("ng_lembrar_email");

      sessionStorage.setItem("usuario", JSON.stringify(data.usuario));
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      if (data.token) {
        sessionStorage.setItem("ng_token", data.token);
        localStorage.setItem("ng_token", data.token);
      }

      window.fecharModal("login-modal");
      atualizarMenuUsuario(data.usuario);
      preencherFormulario();

      if (window.__aguardandoLoginParaPix) {
        window.__aguardandoLoginParaPix = false;
        mostrarToast(
          `Bem-vindo(a), ${data.usuario.nome.split(" ")[0]}! Gerando seu PIX...`,
          "success",
        );
        document.getElementById("btn-pagar")?.click();
      } else {
        mostrarToast("Login realizado com sucesso!", "success");
      }
    } catch (err) {
      mostrarToast(err.message || "Erro ao fazer login", "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = txtOriginal;
      }
    }
  };

  window.fazerCadastro = async function (event) {
    event.preventDefault();
    const nome = document.getElementById("cadastro-nome")?.value.trim();
    const email = document.getElementById("cadastro-email")?.value.trim();
    const telefone = document.getElementById("cadastro-telefone")?.value.trim();
    const senha = document.getElementById("cadastro-senha")?.value;
    const confirmar = document.getElementById(
      "cadastro-confirmar-senha",
    )?.value;
    const btn = event.target.querySelector('button[type="submit"]');
    const txtOriginal = btn ? btn.innerHTML : "Cadastrar";

    if (!nome || nome.split(/\s+/).length < 2) {
      return mostrarToast("Informe seu nome e sobrenome.", "warning");
    }
    if (senha !== confirmar) {
      return mostrarToast("As senhas não coincidem.", "error");
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner spinner-sm"></span> Cadastrando...';
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/usuarios/cadastrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nome, email, telefone, senha }),
      });
      const data = await resp.json();

      if (!resp.ok || !data.success) {
        throw new Error(data.message || "Erro ao realizar cadastro");
      }

      sessionStorage.setItem("usuario", JSON.stringify(data.usuario));
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      if (data.token) {
        sessionStorage.setItem("ng_token", data.token);
        localStorage.setItem("ng_token", data.token);
      }

      window.fecharModal("cadastro-modal");
      atualizarMenuUsuario(data.usuario);
      preencherFormulario();

      if (window.__aguardandoLoginParaPix) {
        window.__aguardandoLoginParaPix = false;
        mostrarToast("Cadastro concluído! Gerando seu PIX...", "success");
        document.getElementById("btn-pagar")?.click();
      } else {
        mostrarToast("Cadastro realizado com sucesso!", "success");
      }
    } catch (err) {
      mostrarToast(err.message || "Erro ao cadastrar", "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = txtOriginal;
      }
    }
  };

  window.fazerLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/usuarios/logout`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
    } catch (e) {}
    sessionStorage.removeItem("usuario");
    sessionStorage.removeItem("ng_token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("ng_token");
    window.location.href = "index.html";
  };

  // =============================================
  // SESSÃO E PREENCHIMENTO AUTOMÁTICO
  // =============================================
  function atualizarMenuUsuario(usuario) {
    if (usuario) {
      document
        .querySelectorAll(".login-item")
        .forEach((el) => (el.style.display = "none"));
      document
        .querySelectorAll(".perfil-item")
        .forEach((el) => (el.style.display = "block"));
      const pn = document.getElementById("menu-perfil-nome");
      if (pn && usuario.nome) pn.textContent = usuario.nome.split(" ")[0];
    } else {
      document
        .querySelectorAll(".login-item")
        .forEach((el) => (el.style.display = "block"));
      document
        .querySelectorAll(".perfil-item")
        .forEach((el) => (el.style.display = "none"));
    }
  }

  async function verificarSessao() {
    const cacheLocal =
      sessionStorage.getItem("usuario") || localStorage.getItem("usuario");
    if (cacheLocal) {
      try {
        const u = JSON.parse(cacheLocal);
        atualizarMenuUsuario(u);
        preencherFormulario();
      } catch (_) {}
    }

    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/verificar`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await response.json();

      if (data.logado && data.usuario) {
        sessionStorage.setItem("usuario", JSON.stringify(data.usuario));
        localStorage.setItem("usuario", JSON.stringify(data.usuario));
        atualizarMenuUsuario(data.usuario);
        preencherFormulario();
      } else {
        sessionStorage.removeItem("usuario");
        localStorage.removeItem("usuario");
        atualizarMenuUsuario(null);
      }
    } catch (e) {}
  }

  function obterUsuarioLogado() {
    const raw =
      sessionStorage.getItem("usuario") || localStorage.getItem("usuario");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function preencherFormulario() {
    const u = obterUsuarioLogado();
    const bannerContainer = document.getElementById("banner-usuario-container");
    if (!u) return;

    const cn = document.getElementById("cliente-nome");
    const ce = document.getElementById("cliente-email");
    const ct = document.getElementById("cliente-telefone");

    if (cn) cn.value = u.nome || "";
    if (ce) ce.value = u.email || "";
    if (ct && u.telefone) ct.value = u.telefone;

    sincronizarReceptor();
  }

  function sincronizarReceptor() {
    const radioSelecionado = document.querySelector(
      'input[name="quem-recebe"]:checked',
    )?.value;
    const reqNome = document.getElementById("receptor-nome");
    const reqTel = document.getElementById("receptor-telefone");
    if (!reqNome || !reqTel) return;

    const u = obterUsuarioLogado();
    const nomeCliente =
      document.getElementById("cliente-nome")?.value.trim() || u?.nome || "";
    const telCliente =
      document.getElementById("cliente-telefone")?.value.trim() ||
      u?.telefone ||
      "";

    if (radioSelecionado === "eu") {
      reqNome.value = nomeCliente;
      reqTel.value = telCliente;
      reqNome.readOnly = true;
      reqTel.readOnly = true;
    } else {
      reqNome.readOnly = false;
      reqTel.readOnly = false;
    }
  }

  document.querySelectorAll('input[name="quem-recebe"]').forEach((radio) => {
    radio.addEventListener("change", sincronizarReceptor);
  });

  // =============================================
  // GOOGLE MAPS E AUTOCOMPLETE
  // =============================================
  function quandoGoogleMapsCarregar(cb) {
    if (window.__googleMapsLoaded) return cb();
    window.addEventListener("google-maps-ready", cb, { once: true });
  }

  function inicializarGoogleMaps() {
    const mapEl = document.getElementById("map");
    if (!mapEl || typeof google === "undefined" || !google.maps) return;
    if (googleMap) return;

    const cfg = window.GOOGLE_MAPS_CONFIG || {};
    googleMap = new google.maps.Map(mapEl, {
      center: cfg.center || { lat: -26.9906, lng: -48.6347 },
      zoom: cfg.defaultZoom || 13,
      mapTypeControl: false,
      streetViewControl: false,
      styles: cfg.styles || [],
    });

    googleMap.addListener("click", async (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      adicionarMarcador("entrega", { lat, lng });
      await atualizarCoordenadasPin("entrega", lat, lng);
    });
  }

  function adicionarMarcador(tipo, position) {
    if (!googleMap) return;
    if (markers[tipo]) markers[tipo].setMap(null);

    markers[tipo] = new google.maps.Marker({
      position,
      map: googleMap,
      title: tipo === "coleta" ? "Coleta (C)" : "Entrega (E)",
      draggable: true,
      animation: google.maps.Animation.DROP,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: tipo === "coleta" ? "#FF6B00" : "#00C48C",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 2.5,
      },
      label: {
        text: tipo === "coleta" ? "C" : "E",
        color: "#fff",
        fontSize: "11px",
        fontWeight: "bold",
      },
    });

    markers[tipo].addListener("dragend", async (event) => {
      await atualizarCoordenadasPin(
        tipo,
        event.latLng.lat(),
        event.latLng.lng(),
      );
    });
  }

  async function atualizarCoordenadasPin(tipo, lat, lng) {
    if (window.orcamentoAtual) {
      if (tipo === "coleta") {
        window.orcamentoAtual.coordsColeta = { lat, lng };
        window.orcamentoAtual.mapsLinkColeta = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      } else {
        window.orcamentoAtual.coordsEntrega = { lat, lng };
        window.orcamentoAtual.mapsLinkEntrega = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      }
    }

    try {
      const resp = await fetch(
        `${API_BASE_URL}/enderecos/reverso?lat=${lat}&lng=${lng}`,
      );
      const data = await resp.json();
      if (data.success && data.endereco) {
        if (tipo === "coleta") {
          window.orcamentoAtual.enderecoColeta = data.endereco;
          document.getElementById("resumo-coleta").textContent = data.endereco;
        } else {
          window.orcamentoAtual.enderecoEntrega = data.endereco;
          document.getElementById("resumo-entrega").textContent = data.endereco;
          const linkEntrega = document.getElementById("link-maps-entrega");
          if (linkEntrega)
            linkEntrega.href = window.orcamentoAtual.mapsLinkEntrega;
        }
        mostrarToast(
          `Ponto ${tipo === "coleta" ? "Coleta (C)" : "Entrega (E)"} ajustado!`,
          "success",
        );
      }
    } catch (err) {}
  }

  function inicializarAutocomplete() {
    function configurarCampoEndereco(tipo) {
      const inputEl = document.getElementById(`endereco-${tipo}`);
      const boxSugestoes = document.getElementById(`sugestoes-${tipo}`);
      const selInfo = document.getElementById(`sel-${tipo}`);
      const inputNum = document.getElementById(`numero-${tipo}`);
      const btnGps = document.getElementById(`btn-gps-${tipo}`);
      if (!inputEl) return;

      let timer = null;

      inputEl.addEventListener("input", () => {
        const valor = inputEl.value.trim();
        window.coordenadasCache[tipo] = { endereco: valor };
        if (selInfo) selInfo.innerHTML = "";

        clearTimeout(timer);
        if (valor.length < 3) {
          if (boxSugestoes) boxSugestoes.style.display = "none";
          return;
        }

        timer = setTimeout(async () => {
          try {
            const r = await fetch(
              `${API_BASE_URL}/enderecos/sugerir?q=${encodeURIComponent(valor)}`,
            );
            const d = await r.json();
            if (!boxSugestoes || !d.sugestoes) return;

            boxSugestoes.innerHTML = d.sugestoes
              .map(
                (s, idx) => `
              <div class="sugestao-item" data-idx="${idx}">
                <i class="bi bi-geo-alt-fill"></i>
                <span>${s.descricao}</span>
              </div>`,
              )
              .join("");
            boxSugestoes.style.display = "block";

            boxSugestoes.querySelectorAll(".sugestao-item").forEach((item) => {
              item.addEventListener("click", async () => {
                const escolhido = d.sugestoes[Number(item.dataset.idx)];
                inputEl.value = escolhido.descricao;
                boxSugestoes.style.display = "none";

                window.coordenadasCache[tipo] = {
                  placeId: escolhido.placeId,
                  endereco: escolhido.descricao,
                };

                if (escolhido.placeId) {
                  try {
                    const detResp = await fetch(
                      `${API_BASE_URL}/enderecos/detalhes?placeId=${encodeURIComponent(escolhido.placeId)}`,
                    );
                    const det = await detResp.json();
                    if (det.success) {
                      window.coordenadasCache[tipo] = {
                        lat: det.lat,
                        lng: det.lng,
                        placeId: escolhido.placeId,
                        endereco: det.endereco || escolhido.descricao,
                        cidade: det.cidade || null,
                      };
                      if (det.numero && inputNum && !inputNum.value) {
                        inputNum.value = det.numero;
                      }
                      if (det.lat && det.lng) {
                        adicionarMarcador(tipo, { lat: det.lat, lng: det.lng });
                      }
                    }
                  } catch (_) {}
                }
              });
            });
          } catch (_) {
            if (boxSugestoes) boxSugestoes.style.display = "none";
          }
        }, 300);
      });

      if (btnGps) {
        btnGps.addEventListener("click", () => {
          if (!navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              const r = await fetch(
                `${API_BASE_URL}/enderecos/reverso?lat=${lat}&lng=${lng}`,
              );
              const d = await r.json();
              if (d.success) {
                inputEl.value = d.endereco;
                window.coordenadasCache[tipo] = {
                  lat,
                  lng,
                  endereco: d.endereco,
                  cidade: d.cidade,
                };
                if (d.numero && inputNum) inputNum.value = d.numero;
                adicionarMarcador(tipo, { lat, lng });
              }
            } catch (err) {}
          });
        });
      }
    }
    configurarCampoEndereco("coleta");
    configurarCampoEndereco("entrega");
  }

  // =============================================
  // WIZARD E FINALIZAÇÃO DE PEDIDOS
  // =============================================
  let currentStep = 0;
  const totalSteps = 6;

  function updateSteps() {
    document.querySelectorAll(".step").forEach((s, i) => {
      s.classList.toggle("completed", i < currentStep);
      s.classList.toggle("active", i === currentStep);
    });
    document.querySelectorAll(".step-content").forEach((c, i) => {
      if (i < totalSteps) c.classList.toggle("active", i === currentStep);
    });
  }

  document.getElementById("btn-avancar")?.addEventListener("click", () => {
    if (currentStep === totalSteps - 1) finalizarPedido();
    else {
      currentStep++;
      updateSteps();
    }
  });

  document.getElementById("btn-voltar")?.addEventListener("click", () => {
    if (currentStep > 0) {
      currentStep--;
      updateSteps();
    }
  });

  function montarEnderecoCompleto(tipo) {
    const base =
      document.getElementById(`endereco-${tipo}`)?.value.trim() ||
      window.coordenadasCache[tipo]?.endereco ||
      "";
    const num = document.getElementById(`numero-${tipo}`)?.value.trim() || "";
    let final = base;
    if (num && !base.includes(num)) final += `, ${num}`;
    return final;
  }

  async function finalizarPedido() {
    const endColetaTexto = montarEnderecoCompleto("coleta");
    const endEntregaTexto = montarEnderecoCompleto("entrega");

    const payloadColeta = {
      ...(window.coordenadasCache.coleta || {}),
      endereco: endColetaTexto,
    };
    const payloadEntrega = {
      ...(window.coordenadasCache.entrega || {}),
      endereco: endEntregaTexto,
    };

    const veiculo =
      document.querySelector('input[name="tipo-veiculo"]:checked')?.value ||
      "moto";
    const nomeCliente = document.getElementById("cliente-nome")?.value.trim();
    const telCliente = document
      .getElementById("cliente-telefone")
      ?.value.trim();
    const emailCliente = document.getElementById("cliente-email")?.value.trim();

    document.getElementById("wizard-container").style.display = "none";
    document.getElementById("checkout-screen").style.display = "block";

    const btn = document.getElementById("btn-pagar");
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Calculando...';

    try {
      const resp = await fetch(`${API_BASE_URL}/rotas/calcular`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          coleta: payloadColeta,
          entrega: payloadEntrega,
          veiculo,
        }),
      });
      const data = await resp.json();
      if (!data.success) throw new Error(data.message || "Falha ao calcular");

      document.getElementById("resumo-coleta").textContent =
        data.rota.origem?.endereco || endColetaTexto;
      document.getElementById("resumo-entrega").textContent =
        data.rota.destino?.endereco || endEntregaTexto;
      document.getElementById("distancia-final").textContent =
        data.rota.distanciaTexto;
      document.getElementById("tempo-final").textContent =
        data.rota.duracaoTexto;
      document.getElementById("valor-final").textContent = formatarMoeda(
        data.valor,
      );

      document.getElementById("mapa-wrapper").style.display = "block";
      inicializarGoogleMaps();

      window.orcamentoAtual = {
        cotacao: data.cotacao,
        valor: data.valor,
        preco: data.valor,
        nome: nomeCliente,
        telefone: telCliente,
        email: emailCliente,
        tipoVeiculo: veiculo,
        enderecoColeta: data.rota.origem?.endereco || endColetaTexto,
        enderecoEntrega: data.rota.destino?.endereco || endEntregaTexto,
        cidadeDestino: data.cidadeDestino || "Balneário Camboriú",
        distancia: data.rota.distanciaTexto,
        duracao: data.rota.duracaoTexto,
        mapsLinkRota: data.rota.mapsLink,
        mapsLinkColeta: `https://www.google.com/maps/search/?api=1&query=${data.rota.origem.lat},${data.rota.origem.lng}`,
        mapsLinkEntrega: `https://www.google.com/maps/search/?api=1&query=${data.rota.destino.lat},${data.rota.destino.lng}`,
        coordsColeta: data.rota.origem,
        coordsEntrega: data.rota.destino,
      };

      // Salva no sessionStorage para nunca zerar o valor após o login no celular
      sessionStorage.setItem(
        "ng_orcamento_atual",
        JSON.stringify(window.orcamentoAtual),
      );

      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-qr-code"></i> Pagar via PIX';
    } catch (e) {
      mostrarToast("Erro ao calcular rota: " + e.message, "error");
      btn.disabled = false;
    }
  }

  // =============================================
  // PIX, CÓPIA COMPATÍVEL COM CELULAR E WHATSAPP
  // =============================================
  window.copiarPix = () => {
    const el = document.getElementById("pix-codigo");
    const codigo = el?.getAttribute("data-codigo") || el?.textContent || "";
    if (!codigo || codigo.includes("Gerando")) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(codigo)
        .then(() => {
          mostrarToast("Código PIX copiado com sucesso!", "success");
        })
        .catch(() => {
          executarFallbackCopia(codigo);
        });
    } else {
      executarFallbackCopia(codigo);
    }
  };

  function executarFallbackCopia(texto) {
    const textarea = document.createElement("textarea");
    textarea.value = texto;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      const sucesso = document.execCommand("copy");
      if (sucesso) {
        mostrarToast("Código PIX copiado com sucesso!", "success");
      } else {
        mostrarToast("Selecione e copie o código manualmente.", "warning");
      }
    } catch (err) {
      mostrarToast("Erro ao copiar o código PIX.", "error");
    }
    document.body.removeChild(textarea);
  }

  document.getElementById("btn-pagar")?.addEventListener("click", async () => {
    // Garante a recuperação imediata do orçamento no celular ou desktop se a referência estiver limpa
    if (!window.orcamentoAtual) {
      const cacheRecuperado = sessionStorage.getItem("ng_orcamento_atual");
      if (cacheRecuperado) {
        try {
          window.orcamentoAtual = JSON.parse(cacheRecuperado);
        } catch (e) {}
      }
    }

    const o = window.orcamentoAtual;
    if (!o || (!o.valor && !o.preco)) {
      mostrarToast(
        "Erro: Os dados do orçamento expiraram. Por favor, calcule a rota novamente.",
        "error",
      );
      return;
    }

    const u = obterUsuarioLogado();
    if (!u) {
      window.__aguardandoLoginParaPix = true;
      abrirModalLogin();
      return;
    }

    const valorAtualCalculado = o.valor || o.preco || 0;
    const valorFormatado = formatarMoeda(valorAtualCalculado);

    // Abre o modal e injeta o valor em todos os seletores comuns de preço para evitar o R$ 0,00 no celular
    const modalPagamento = document.getElementById("modal-pagamento");
    if (modalPagamento) modalPagamento.style.display = "flex";

    const elementosPreco = [
      document.getElementById("modal-valor"),
      document.getElementById("checkout-valor"),
      document.querySelector("#modal-pagamento .valor"),
      document.querySelector("#modal-pagamento h3"),
      document.querySelector("#modal-pagamento span[class*='valor']"),
    ];

    elementosPreco.forEach((el) => {
      if (el) el.textContent = valorFormatado;
    });

    const qrContainer = document.getElementById("qr-container");
    if (qrContainer) {
      qrContainer.innerHTML =
        '<div class="spinner"></div><span>Gerando QR Code no Mercado Pago...</span>';
    }

    const pixCodigoEl = document.getElementById("pix-codigo");
    if (pixCodigoEl) pixCodigoEl.textContent = "Gerando código PIX...";

    const payWait = document.getElementById("pay-wait");
    if (payWait) payWait.style.display = "none";

    try {
      const resp = await fetch(`${API_BASE_URL}/pix/criar`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          cotacao: o.cotacao,
          pedido: o,
        }),
      });
      const data = await resp.json();
      if (!data.success)
        throw new Error(data.erro || "Não foi possível gerar o PIX.");

      // Se o servidor retornar o valor exato atualizado, reaplica nos elementos
      if (data.valor) {
        o.valor = data.valor;
        o.preco = data.valor;
        const valStr = formatarMoeda(data.valor);
        elementosPreco.forEach((el) => {
          if (el) el.textContent = valStr;
        });
      }

      paymentData.paymentId = data.paymentId;
      window.orcamentoAtual.numeroPedido = data.numeroPedido;
      window.orcamentoAtual.paymentId = data.paymentId;

      if (qrContainer) {
        qrContainer.innerHTML = "";
        if (data.qrCodeBase64) {
          qrContainer.innerHTML = `<img src="data:image/png;base64,${data.qrCodeBase64}" alt="PIX">`;
        }
      }

      if (pixCodigoEl) {
        pixCodigoEl.textContent = data.qrCode;
        pixCodigoEl.setAttribute("data-codigo", data.qrCode);
      }

      if (payWait) payWait.style.display = "flex";
      iniciarVerificacaoPagamento(data.paymentId);
    } catch (e) {
      mostrarViewModalPix("erro");
      const errEl = document.getElementById("pay-erro-msg");
      if (errEl) errEl.textContent = e.message;
    }
  });

  function gerarLinkComprovanteWhatsApp() {
    const o = window.orcamentoAtual || {};
    const numeroWhats = window.WHATSAPP_CONFIG?.numero || "5547999123260";
    const mensagem = `COMPROVANTE DE PAGAMENTO - N&G EXPRESS

PEDIDO: #${o.numeroPedido || "NOVO"}
DATA: ${new Date().toLocaleString("pt-BR")}

CLIENTE
- Nome: 
${o.nome}
- WhatsApp: 
${o.telefone}

DADOS DA CORRIDA
- Veículo: 
${o.tipoVeiculo === "carro" ? "Carro" : "Moto"}
- Coleta: 
${o.enderecoColeta}
- Entrega: 
${o.enderecoEntrega}
- Distância: 
${o.distancia} (${o.duracao})

VALOR PAGO: ${formatarMoeda(o.preco)} (PIX Confirmado)
Rota no Maps: ${o.mapsLinkRota || ""}`;

    return `https://wa.me/${numeroWhats}?text=${encodeURIComponent(mensagem)}`;
  }

  quandoGoogleMapsCarregar(() => inicializarGoogleMaps());
  inicializarAutocomplete();
  verificarSessao();
  updateSteps();
});
