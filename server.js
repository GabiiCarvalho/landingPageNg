document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 N&G EXPRESS iniciado");

  const API_BASE_URL = (
    window.API_BASE_URL || "http://localhost:3000/api"
  ).replace(/\/$/, "");

  let googleMap = null;
  let routePolyline = null;
  let markers = { coleta: null, entrega: null };
  window.orcamentoAtual = null;
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

  if (typeof Swiper !== "undefined" && document.querySelector(".hero-swiper")) {
    new Swiper(".hero-swiper", {
      loop: true,
      autoplay: { delay: 5000, disableOnInteraction: false },
      pagination: { el: ".swiper-pagination", clickable: true },
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
      } else if (window.location.pathname.includes("novo-pedido")) {
        mostrarToast(
          `Bem-vindo(a), ${data.usuario.nome.split(" ")[0]}!`,
          "success",
        );
      } else {
        mostrarToast(
          "Login realizado! Redirecionando para seu painel...",
          "success",
        );
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 600);
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
      } else if (window.location.pathname.includes("novo-pedido")) {
        mostrarToast("Cadastro realizado com sucesso!", "success");
      } else {
        mostrarToast("Cadastro realizado! Abrindo seu painel...", "success");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 600);
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
    } catch (e) {
      console.warn("Sessão offline ou não verificada.");
    }
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
    if (!u) {
      if (bannerContainer) {
        bannerContainer.innerHTML = `
          <div class="banner-usuario aviso">
            <i class="bi bi-info-circle-fill"></i>
            <span>Faça <a href="#" onclick="abrirModalLogin();return false;"><strong>login</strong></a> ou <a href="#" onclick="abrirModalCadastro();return false;"><strong>cadastre-se</strong></a> para preencher seus dados automaticamente e salvar no seu histórico.</span>
          </div>
        `;
      }
      return;
    }

    const cn = document.getElementById("cliente-nome");
    const ce = document.getElementById("cliente-email");
    const ct = document.getElementById("cliente-telefone");

    if (cn) cn.value = u.nome || "";
    if (ce) ce.value = u.email || "";
    if (ct && u.telefone) ct.value = u.telefone;

    if (bannerContainer) {
      bannerContainer.innerHTML = `
        <div class="banner-usuario" id="banner-usuario">
          <i class="bi bi-check-circle-fill"></i>
          <span>Olá, <strong>${u.nome.split(" ")[0]}</strong>! Seus dados foram preenchidos automaticamente.</span>
        </div>
      `;
    }

    sincronizarReceptor();
  }

  // =============================================
  // RÁDIO QUEM VAI RECEBER
  // =============================================
  function sincronizarReceptor() {
    const radioSelecionado = document.querySelector(
      'input[name="quem-recebe"]:checked',
    )?.value;
    const reqNome = document.getElementById("receptor-nome");
    const reqTel = document.getElementById("receptor-telefone");
    const dica = document.getElementById("receptor-dica");
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
      reqNome.required = false;
      reqTel.required = false;
      reqNome.classList.remove("campo-erro");
      reqTel.classList.remove("campo-erro");
      if (dica) {
        dica.textContent =
          "Seus dados de cliente foram preenchidos automaticamente como recebedor.";
      }
    } else {
      if (reqNome.readOnly) {
        reqNome.value = "";
        reqTel.value = "";
      }
      reqNome.readOnly = false;
      reqTel.readOnly = false;
      reqNome.required = true;
      reqTel.required = true;
      if (dica) {
        dica.textContent =
          "Obrigatório informar o nome completo (nome e sobrenome) e o WhatsApp/Telefone de quem irá receber.";
      }
      reqNome.focus();
    }
  }

  document.querySelectorAll('input[name="quem-recebe"]').forEach((radio) => {
    radio.addEventListener("change", sincronizarReceptor);
  });

  document
    .getElementById("cliente-nome")
    ?.addEventListener("input", sincronizarReceptor);
  document
    .getElementById("cliente-telefone")
    ?.addEventListener("input", sincronizarReceptor);

  // =============================================
  // SINCRONIZAÇÃO SIMULTÂNEA ENDEREÇO <-> NÚMERO
  // =============================================
  function configurarSincronizacaoEnderecoNumero(tipo) {
    const inputEnd = document.getElementById(`endereco-${tipo}`);
    const inputNum = document.getElementById(`numero-${tipo}`);
    if (!inputEnd || !inputNum) return;

    inputEnd.addEventListener("input", () => {
      const valor = inputEnd.value;
      const matchNumero = valor.match(/,\s*(\d+[a-zA-Z]*)/);
      if (matchNumero && matchNumero[1] && !inputNum.value) {
        inputNum.value = matchNumero[1];
      }
    });

    inputNum.addEventListener("input", () => {
      if (window.coordenadasCache && window.coordenadasCache[tipo]) {
        window.coordenadasCache[tipo].numero = inputNum.value;
      }
    });
  }

  configurarSincronizacaoEnderecoNumero("coleta");
  configurarSincronizacaoEnderecoNumero("entrega");

  // =============================================
  // GOOGLE MAPS E AUTOCOMPLETE (100% GOOGLE PLACES NEW)
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
      zoom: 16,
      mapTypeControl: false,
      streetViewControl: false,
      styles: cfg.styles || [],
    });

    // Permite clicar no mapa para ajustar a precisão do pino de entrega
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
      title:
        tipo === "coleta"
          ? "Coleta (C) - Arraste ou clique"
          : "Entrega (E) - Arraste ou clique",
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
          `Ponto ${tipo === "coleta" ? "Coleta (C)" : "Entrega (E)"} ajustado com precisão cirúrgica!`,
          "success",
        );
      }
    } catch (err) {
      console.warn("Erro ao atualizar endereço exato:", err);
    }
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
            if (!boxSugestoes) return;

            if (!d.sugestoes || d.sugestoes.length === 0) {
              boxSugestoes.style.display = "none";
              return;
            }

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

                if (selInfo) {
                  selInfo.innerHTML = `<i class="bi bi-check-circle-fill"></i> <span>${escolhido.descricao}</span>`;
                }
              });
            });
          } catch (_) {
            if (boxSugestoes) boxSugestoes.style.display = "none";
          }
        }, 300);
      });

      document.addEventListener("click", (e) => {
        if (
          boxSugestoes &&
          !inputEl.contains(e.target) &&
          !boxSugestoes.contains(e.target)
        ) {
          boxSugestoes.style.display = "none";
        }
      });

      if (btnGps) {
        btnGps.addEventListener("click", () => {
          if (!navigator.geolocation) {
            return mostrarToast("Seu navegador não suporta GPS.", "error");
          }
          const htmlOriginal = btnGps.innerHTML;
          btnGps.innerHTML = '<span class="spinner spinner-sm"></span>';
          btnGps.disabled = true;

          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              try {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                const r = await fetch(
                  `${API_BASE_URL}/enderecos/reverso?lat=${lat}&lng=${lng}`,
                );
                const d = await r.json();
                if (!r.ok || !d.success) {
                  throw new Error(
                    d.message || "Erro ao buscar localização no Google Maps",
                  );
                }

                const endFormatado = d.endereco;
                inputEl.value = endFormatado;
                window.coordenadasCache[tipo] = {
                  lat,
                  lng,
                  endereco: endFormatado,
                  cidade: d.cidade || null,
                };

                if (d.numero && inputNum) inputNum.value = d.numero;
                if (selInfo) {
                  selInfo.innerHTML = `<i class="bi bi-check-circle-fill"></i> <span>Google Maps GPS: ${endFormatado}</span>`;
                }

                adicionarMarcador(tipo, { lat, lng });
                mostrarToast("Localização obtida pelo Google Maps!", "success");
              } catch (err) {
                mostrarToast(err.message, "error");
              } finally {
                btnGps.innerHTML = htmlOriginal;
                btnGps.disabled = false;
              }
            },
            () => {
              mostrarToast(
                "Permissão de localização negada. Ative o GPS no navegador.",
                "warning",
              );
              btnGps.innerHTML = htmlOriginal;
              btnGps.disabled = false;
            },
            { enableHighAccuracy: true, timeout: 12000 },
          );
        });
      }
    }

    configurarCampoEndereco("coleta");
    configurarCampoEndereco("entrega");
  }

  // =============================================
  // WIZARD (ETAPAS DO PEDIDO)
  // =============================================
  let currentStep = 0;
  const totalSteps = 6;

  function validarEtapaAtual() {
    if (currentStep === 0) {
      const nome = document.getElementById("cliente-nome")?.value.trim();
      const tel = document.getElementById("cliente-telefone")?.value.trim();
      const email = document.getElementById("cliente-email")?.value.trim();
      if (!nome) {
        mostrarToast("Informe seu nome completo.", "warning");
        document.getElementById("cliente-nome")?.focus();
        return false;
      }
      if (!tel || tel.replace(/\D/g, "").length < 10) {
        mostrarToast("Informe um WhatsApp/Telefone válido com DDD.", "warning");
        document.getElementById("cliente-telefone")?.focus();
        return false;
      }
      if (!email || !email.includes("@")) {
        mostrarToast("Informe um e-mail válido.", "warning");
        document.getElementById("cliente-email")?.focus();
        return false;
      }
    }

    if (currentStep === 2) {
      const endColeta = document
        .getElementById("endereco-coleta")
        ?.value.trim();
      if (!endColeta && !window.coordenadasCache.coleta?.lat) {
        mostrarToast("Informe o endereço de coleta.", "warning");
        document.getElementById("endereco-coleta")?.focus();
        return false;
      }
    }

    if (currentStep === 3) {
      const endEntrega = document
        .getElementById("endereco-entrega")
        ?.value.trim();
      if (!endEntrega && !window.coordenadasCache.entrega?.lat) {
        mostrarToast("Informe o endereço de entrega.", "warning");
        document.getElementById("endereco-entrega")?.focus();
        return false;
      }
    }

    if (currentStep === 4) {
      const quemRecebe = document.querySelector(
        'input[name="quem-recebe"]:checked',
      )?.value;
      const inputNome = document.getElementById("receptor-nome");
      const inputTel = document.getElementById("receptor-telefone");
      const nome = inputNome?.value.trim() || "";
      const tel = inputTel?.value.trim() || "";

      if (quemRecebe === "outro") {
        if (nome.split(/\s+/).length < 2) {
          inputNome?.classList.add("campo-erro");
          inputNome?.focus();
          mostrarToast(
            "Informe o nome completo (nome e sobrenome) de quem irá receber.",
            "warning",
          );
          return false;
        }
        inputNome?.classList.remove("campo-erro");

        if (tel.replace(/\D/g, "").length < 10) {
          inputTel?.classList.add("campo-erro");
          inputTel?.focus();
          mostrarToast(
            "Informe o Telefone / WhatsApp com DDD de quem irá receber.",
            "warning",
          );
          return false;
        }
        inputTel?.classList.remove("campo-erro");
      }
    }

    return true;
  }

  function updateSteps() {
    const btnVoltar = document.getElementById("btn-voltar");
    const btnAvancar = document.getElementById("btn-avancar");
    if (!btnVoltar || !btnAvancar) return;

    document.querySelectorAll(".step").forEach((s, i) => {
      s.classList.toggle("completed", i < currentStep);
      s.classList.toggle("active", i === currentStep);
    });
    document.querySelectorAll(".step-content").forEach((c, i) => {
      if (i < totalSteps) c.classList.toggle("active", i === currentStep);
    });

    btnVoltar.disabled = currentStep === 0;
    btnAvancar.innerHTML =
      currentStep === totalSteps - 1
        ? 'Ver Resumo e Valor <i class="bi bi-check-lg"></i>'
        : 'Avançar <i class="bi bi-arrow-right"></i>';

    if (currentStep === 0) preencherFormulario();
    if (currentStep === 4) sincronizarReceptor();
  }

  document.getElementById("btn-avancar")?.addEventListener("click", () => {
    if (!validarEtapaAtual()) return;
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

  document.getElementById("btn-cancelar")?.addEventListener("click", () => {
    document.getElementById("checkout-screen").style.display = "none";
    document.getElementById("wizard-container").style.display = "block";
  });

  // =============================================
  // FINALIZAR E CALCULAR ROTA
  // =============================================
  function montarEnderecoCompleto(tipo) {
    const base =
      document.getElementById(`endereco-${tipo}`)?.value.trim() ||
      window.coordenadasCache[tipo]?.endereco ||
      "";
    const num = document.getElementById(`numero-${tipo}`)?.value.trim() || "";
    const comp =
      document.getElementById(`complemento-${tipo}`)?.value.trim() || "";
    let final = base;
    if (num && !base.includes(num)) final += `, ${num}`;
    if (comp) final += ` (${comp})`;
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
    const quemRecebe = document.querySelector(
      'input[name="quem-recebe"]:checked',
    )?.value;

    const nomeCliente = document.getElementById("cliente-nome").value.trim();
    const telCliente = document.getElementById("cliente-telefone").value.trim();
    const emailCliente = document.getElementById("cliente-email").value.trim();

    const receptorNome =
      quemRecebe === "outro"
        ? document.getElementById("receptor-nome").value.trim()
        : nomeCliente;
    const receptorTelefone =
      quemRecebe === "outro"
        ? document.getElementById("receptor-telefone").value.trim()
        : telCliente;

    const categoriasSelecionadas = Array.from(
      document.querySelectorAll('input[name="categoria"]:checked'),
    ).map((el) => el.value);
    const descricao = document.getElementById("descricao")?.value.trim() || "";

    document.getElementById("wizard-container").style.display = "none";
    document.getElementById("checkout-screen").style.display = "block";

    document.getElementById("resumo-nome").textContent = nomeCliente;
    document.getElementById("resumo-telefone").textContent = telCliente;
    document.getElementById("resumo-veiculo").textContent =
      veiculo === "carro" ? "🚗 Carro" : "🏍️ Moto";
    document.getElementById("resumo-coleta").textContent = endColetaTexto;
    document.getElementById("resumo-entrega").textContent = endEntregaTexto;
    document.getElementById("resumo-receptor").textContent =
      `${receptorNome} (${receptorTelefone})`;
    document.getElementById("resumo-categorias").textContent =
      categoriasSelecionadas.length > 0
        ? categoriasSelecionadas.join(", ")
        : descricao || "Geral";

    const btn = document.getElementById("btn-pagar");
    btn.disabled = true;
    btn.innerHTML =
      '<span class="spinner spinner-sm"></span> Calculando rota no Google Maps...';

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
      if (!data.success)
        throw new Error(data.message || "Falha ao calcular rota");

      const endColetaReal = data.rota.origem?.endereco || endColetaTexto;
      const endEntregaReal = data.rota.destino?.endereco || endEntregaTexto;

      document.getElementById("resumo-coleta").textContent = endColetaReal;
      document.getElementById("resumo-entrega").textContent = endEntregaReal;
      document.getElementById("distancia-final").textContent =
        data.rota.distanciaTexto;
      document.getElementById("tempo-final").textContent =
        data.rota.duracaoTexto;
      document.getElementById("cidade-destino").textContent =
        data.cidadeDestino || "Balneário Camboriú";
      document.getElementById("valor-final").textContent = formatarMoeda(
        data.valor,
      );
      document.getElementById("valor-info").textContent =
        "Valor calculado pela distância oficial do Google Maps";

      document.getElementById("mapa-wrapper").style.display = "block";
      inicializarGoogleMaps();

      if (
        googleMap &&
        typeof google !== "undefined" &&
        google.maps?.geometry &&
        data.rota.polyline
      ) {
        if (routePolyline) routePolyline.setMap(null);
        const path = google.maps.geometry.encoding.decodePath(
          data.rota.polyline,
        );
        routePolyline = new google.maps.Polyline({
          path,
          map: googleMap,
          strokeColor: "#FF6B00",
          strokeWeight: 5,
        });
        adicionarMarcador("coleta", data.rota.origem);
        adicionarMarcador("entrega", data.rota.destino);
        const bounds = new google.maps.LatLngBounds();
        path.forEach((p) => bounds.extend(p));
        googleMap.fitBounds(bounds);
      }

      window.orcamentoAtual = {
        cotacao: data.cotacao,
        valor: data.valor,
        preco: data.valor,
        nome: nomeCliente,
        telefone: telCliente,
        email: emailCliente,
        tipoVeiculo: veiculo,
        enderecoColeta: endColetaReal,
        enderecoEntrega: endEntregaReal,
        cidadeDestino: data.cidadeDestino || "Balneário Camboriú",
        distancia: data.rota.distanciaTexto,
        duracao: data.rota.duracaoTexto,
        distanciaNum: data.rota.distanciaKm,
        receptorNome,
        receptorTelefone,
        categorias: categoriasSelecionadas,
        descricao,
        mapsLinkRota: data.rota.mapsLink,
        mapsLinkColeta: `https://www.google.com/maps/search/?api=1&query=${data.rota.origem.lat},${data.rota.origem.lng}`,
        mapsLinkEntrega: `https://www.google.com/maps/search/?api=1&query=${data.rota.destino.lat},${data.rota.destino.lng}`,
        coordsColeta: data.rota.origem,
        coordsEntrega: data.rota.destino,
      };

      const linkColeta = document.getElementById("link-maps-coleta");
      const linkEntrega = document.getElementById("link-maps-entrega");
      if (linkColeta) linkColeta.href = window.orcamentoAtual.mapsLinkColeta;
      if (linkEntrega) linkEntrega.href = window.orcamentoAtual.mapsLinkEntrega;

      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-qr-code"></i> Pagar via PIX';
    } catch (e) {
      mostrarToast("Erro ao calcular a rota: " + e.message, "error");
      document.getElementById("valor-final").textContent = "Erro no cálculo";
      document.getElementById("valor-info").textContent = e.message;
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-arrow-left"></i> Revisar Endereços';
      btn.onclick = () => {
        document.getElementById("checkout-screen").style.display = "none";
        document.getElementById("wizard-container").style.display = "block";
        currentStep = 2;
        updateSteps();
        btn.onclick = null;
      };
    }
  }

  // =============================================
  // PAGAMENTO PIX (POP-UP MERCADO PAGO + POLLING)
  // =============================================
  let paymentData = { paymentId: null, intervalId: null, confirmado: false };

  function mostrarViewModalPix(view) {
    ["qr", "ok", "erro"].forEach((v) => {
      const el = document.getElementById(`pay-view-${v}`);
      if (el) el.style.display = v === view ? "block" : "none";
    });
  }

  window.fecharModalPagamento = function () {
    if (paymentData.intervalId) {
      clearInterval(paymentData.intervalId);
      paymentData.intervalId = null;
    }
    const modal = document.getElementById("modal-pagamento");
    if (modal) modal.style.display = "none";
  };

  window.copiarPix = () => {
    const el = document.getElementById("pix-codigo");
    const codigo = el?.getAttribute("data-codigo") || el?.textContent || "";
    if (!codigo || codigo.includes("Gerando")) return;
    navigator.clipboard
      .writeText(codigo)
      .then(() => mostrarToast("Código PIX copiado!", "success"));
  };

  document.getElementById("btn-pagar")?.addEventListener("click", async () => {
    if (!window.orcamentoAtual) return;

    const u = obterUsuarioLogado();
    if (!u) {
      window.__aguardandoLoginParaPix = true;
      mostrarToast(
        "Entre na sua conta ou cadastre-se rapidinho para gerar o PIX e registrar seu pedido!",
        "warning",
      );
      window.abrirModalLogin();
      return;
    }

    const o = window.orcamentoAtual;
    paymentData.confirmado = false;
    mostrarViewModalPix("qr");

    document.getElementById("modal-pagamento").style.display = "flex";
    document.getElementById("modal-valor").textContent = formatarMoeda(o.valor);
    document.getElementById("qr-container").innerHTML =
      '<div class="spinner"></div><span>Gerando QR Code no Mercado Pago...</span>';
    document.getElementById("pix-codigo").textContent = "Gerando código PIX...";
    document.getElementById("pay-wait").style.display = "none";

    try {
      const resp = await fetch(`${API_BASE_URL}/pix/criar`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          cotacao: o.cotacao,
          pedido: {
            enderecoColeta: o.enderecoColeta,
            enderecoEntrega: o.enderecoEntrega,
            coordsColeta: o.coordsColeta,
            coordsEntrega: o.coordsEntrega,
            receptorNome: o.receptorNome,
            receptorTelefone: o.receptorTelefone,
            categorias: o.categorias,
            descricao: o.descricao,
          },
        }),
      });

      if (resp.status === 401) {
        window.fecharModalPagamento();
        window.__aguardandoLoginParaPix = true;
        mostrarToast("Sua sessão expirou. Faça login novamente.", "warning");
        window.abrirModalLogin();
        return;
      }

      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.erro || "Não foi possível gerar o PIX.");
      }

      paymentData.paymentId = data.paymentId;
      window.orcamentoAtual.numeroPedido = data.numeroPedido;
      window.orcamentoAtual.paymentId = data.paymentId;

      const qrContainer = document.getElementById("qr-container");
      qrContainer.innerHTML = "";
      if (data.qrCodeBase64) {
        qrContainer.innerHTML = `<img src="data:image/png;base64,${data.qrCodeBase64}" alt="QR Code PIX">`;
      } else if (typeof QRCode !== "undefined") {
        new QRCode(qrContainer, {
          text: data.qrCode,
          width: 180,
          height: 180,
        });
      }

      const pixCodigoEl = document.getElementById("pix-codigo");
      pixCodigoEl.textContent = data.qrCode;
      pixCodigoEl.setAttribute("data-codigo", data.qrCode);

      document.getElementById("pay-wait").style.display = "flex";
      iniciarVerificacaoPagamento(data.paymentId);
    } catch (e) {
      mostrarViewModalPix("erro");
      document.getElementById("pay-erro-msg").textContent =
        e.message || "Erro ao comunicar com o Mercado Pago.";
    }
  });

  async function checarStatusPix(paymentId, manual = false) {
    if (!paymentId || paymentData.confirmado) return;
    try {
      const res = await fetch(`${API_BASE_URL}/pix/status/${paymentId}`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (
          data.status === "approved" ||
          data.pedido?.status_pagamento === "aprovado"
        ) {
          paymentData.confirmado = true;
          if (paymentData.intervalId) clearInterval(paymentData.intervalId);
          pagamentoConfirmado();
          return;
        }
      }
      if (manual) {
        mostrarToast(
          "Pagamento ainda pendente. Assim que confirmado, liberaremos automaticamente!",
          "warning",
        );
      }
    } catch (e) {
      console.warn("Polling PIX:", e.message);
    }
  }

  window.verificarPagamentoAgora = function () {
    if (paymentData.paymentId) {
      checarStatusPix(paymentData.paymentId, true);
    }
  };

  function iniciarVerificacaoPagamento(paymentId) {
    if (!paymentId) return;
    if (paymentData.intervalId) clearInterval(paymentData.intervalId);
    paymentData.intervalId = setInterval(() => {
      checarStatusPix(paymentId, false);
    }, 3000);
  }

  function pagamentoConfirmado() {
    const o = window.orcamentoAtual || {};
    const u = obterUsuarioLogado();
    const primeiroNome = (u?.nome || o.nome || "Cliente").split(" ")[0];

    mostrarViewModalPix("ok");
    document.getElementById("ok-msg").innerHTML =
      `Muito obrigado, <strong>${primeiroNome}</strong>! Seu pagamento foi confirmado com sucesso e nossa equipe já recebeu sua solicitação de entrega.`;
    document.getElementById("ok-pedido").textContent =
      `#${o.numeroPedido || "—"}`;
    document.getElementById("ok-valor").textContent = formatarMoeda(o.valor);

    const urlWhats = gerarLinkComprovanteWhatsApp();
    const btnWhats = document.getElementById("btn-whats");
    if (btnWhats) btnWhats.href = urlWhats;

    const statusWhats = document.getElementById("whats-status");
    if (statusWhats) {
      statusWhats.textContent =
        "Encaminhando comprovante automaticamente para o WhatsApp da N&G Express...";
    }

    mostrarToast("Pagamento confirmado com sucesso!", "success");

    setTimeout(() => {
      const win = window.open(urlWhats, "_blank");
      if (statusWhats) {
        statusWhats.textContent = win
          ? "Comprovante encaminhado para o WhatsApp!"
          : "Clique no botão verde acima para abrir o comprovante no WhatsApp.";
      }
    }, 1200);
  }

  function gerarLinkComprovanteWhatsApp() {
    const o = window.orcamentoAtual || {};
    const numeroWhats = window.WHATSAPP_CONFIG?.numero || "5547999123260";

    const receptorNome = o.receptorNome || o.nome;
    const receptorTel = o.receptorTelefone || o.telefone;

    const mensagem = `COMPROVANTE DE PAGAMENTO - N&G EXPRESS

PEDIDO: #${o.numeroPedido || "NOVO"}
DATA: ${new Date().toLocaleString("pt-BR")}

CLIENTE
- Nome: ${o.nome}
- WhatsApp: ${o.telefone}
- E-mail: ${o.email}

DADOS DA CORRIDA
- Veículo: ${o.tipoVeiculo === "carro" ? "Carro" : "Moto"}
- Coleta: ${o.enderecoColeta}
- Entrega: ${o.enderecoEntrega}
- Cidade Destino: ${o.cidadeDestino}
- Distância: ${o.distancia} (${o.duracao})

QUEM VAI RECEBER
- Nome: ${receptorNome}
- Telefone: ${receptorTel}
- Produto: ${(o.categorias || []).join(", ") || "Geral"} ${o.descricao ? `(${o.descricao})` : ""}

VALOR PAGO: *${formatarMoeda(o.preco)}* (PIX Confirmado)
Rota no Maps: ${o.mapsLinkRota || ""}`;

    return `https://wa.me/${numeroWhats}?text=${encodeURIComponent(mensagem)}`;
  }

  quandoGoogleMapsCarregar(() => {
    inicializarGoogleMaps();
  });

  inicializarAutocomplete();
  verificarSessao();
  updateSteps();
});

module.exports = app;

if (process.env.NODE_ENV !== "production" && !process.env.NETLIFY) {
  app.listen(PORT, () =>
    console.log(`🚚 N&G Express rodando em http://localhost:${PORT}`),
  );
}
