document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 Sistema N&G EXPRESS iniciado!");

  // ============================================================
  //  ESTADO GLOBAL
  // ============================================================
  window.orcamentoAtual = null;
  window.distanciaAtual = null;
  window.coordenadasCache = { coleta: null, entrega: null };

  let googleMap = null;
  let googleDirectionsService = null;
  let googleDirectionsRenderer = null;
  let googleGeocoder = null;
  let markers = { coleta: null, entrega: null };
  let googleMapsPronto = false;

  const _cidadeCache = {};

  // ============================================================
  //  UTILITÁRIOS
  // ============================================================
  function atualizarAno() {
    const el = document.getElementById("currentYear");
    if (el) el.textContent = new Date().getFullYear();
  }

  function aplicarMascaraTelefone() {
    const tel = document.getElementById("cliente-telefone");
    if (!tel) return;
    function mascara(valor) {
      let v = valor.replace(/\D/g, "").substring(0, 11);
      if (v.length <= 10)
        return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
      return v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    }
    tel.addEventListener("input", (e) => {
      e.target.value = mascara(e.target.value);
    });
    tel.addEventListener("paste", (e) => {
      e.preventDefault();
      const texto = (e.clipboardData || window.clipboardData).getData("text");
      e.target.value = mascara(texto);
    });
  }

  function formatarMoeda(valor) {
    return `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;
  }

  function normalizarTexto(txt) {
    return (txt || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function mostrarToast(msg, tipo = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const icone =
      tipo === "success"
        ? "check-circle"
        : tipo === "warning"
          ? "exclamation-triangle"
          : "exclamation-circle";
    const toast = document.createElement("div");
    toast.className = `toast toast-${tipo}`;
    toast.innerHTML = `<i class="bi bi-${icone}"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.4s";
      setTimeout(() => toast.remove(), 400);
    }, 4600);
  }
  window.mostrarToast = mostrarToast;

  // ============================================================
  //  UI LOGADO/DESLOGADO
  // ============================================================
  function inicializarLembrarEmail() {
    const campoEmail = document.getElementById("login-email");
    const checkbox = document.getElementById("lembrar-email");
    if (!campoEmail || !checkbox) return;
    const emailSalvo = localStorage.getItem("ng_email_salvo");
    if (emailSalvo) {
      campoEmail.value = emailSalvo;
      checkbox.checked = true;
    }
  }

  function atualizarUILogado(usuario) {
    document
      .querySelectorAll(".login-item")
      .forEach((el) => (el.style.display = "none"));
    document
      .querySelectorAll(".perfil-item")
      .forEach((el) => (el.style.display = "block"));
    const perfilNome = document.getElementById("menu-perfil-nome");
    if (perfilNome && usuario?.nome)
      perfilNome.textContent = usuario.nome.split(" ")[0];
  }

  function atualizarUIDeslogado() {
    document
      .querySelectorAll(".login-item")
      .forEach((el) => (el.style.display = "block"));
    document
      .querySelectorAll(".perfil-item")
      .forEach((el) => (el.style.display = "none"));
  }

  function preencherFormularioComUsuario(usuario) {
    if (!usuario) return;
    const campos = {
      "cliente-nome": usuario.nome,
      "cliente-email": usuario.email,
      "cliente-telefone": usuario.telefone,
    };
    Object.entries(campos).forEach(([id, valor]) => {
      const campo = document.getElementById(id);
      if (campo && !campo.value && valor) campo.value = valor;
    });
    exibirBannerUsuario(usuario);
  }

  function exibirBannerUsuario(usuario) {
    const form = document.getElementById("form-orcamento");
    if (!form || document.getElementById("banner-usuario")) return;
    const banner = document.createElement("div");
    banner.id = "banner-usuario";
    banner.style.cssText = `
            background: #e8f5e9; border: 1px solid #a5d6a7; border-radius: 10px;
            padding: 10px 16px; margin-bottom: 20px; font-size: .9rem;
            display: flex; align-items: center; gap: 10px; color: #2e7d32;`;
    const primeiroNome = (usuario.nome || "usuário").split(" ")[0];
    banner.innerHTML = `
            <i class="bi bi-person-check-fill" style="font-size:1.2rem;"></i>
            <span>Olá, <strong>${primeiroNome}</strong>! Seus dados foram preenchidos automaticamente.</span>
            <a href="dashboard.html" style="margin-left:auto;color:#1b5e20;font-weight:600;font-size:.85rem;white-space:nowrap;">
                <i class="bi bi-speedometer2"></i> Meu Painel
            </a>`;
    form.insertBefore(banner, form.firstChild);
  }

  // ============================================================
  //  SESSÃO
  // ============================================================
  function servidorNaoExecutaPHP(texto) {
    const t = texto.trimStart();
    return t.startsWith("<?php") || t.startsWith("<?");
  }

  async function verificarSessao() {
    if (
      window.location.protocol !== "http:" &&
      window.location.protocol !== "https:"
    ) {
      usarSessaoLocal();
      return;
    }
    const cached = sessionStorage.getItem("usuario");
    if (cached) {
      try {
        const usuario = JSON.parse(cached);
        atualizarUILogado(usuario);
        preencherFormularioComUsuario(usuario);
      } catch {
        sessionStorage.removeItem("usuario");
        atualizarUIDeslogado();
      }
      return;
    }
    try {
      const response = await fetch(
        `${window.API_BASE_URL}/usuarios/verificar.php`,
      );
      const texto = await response.text();
      if (servidorNaoExecutaPHP(texto)) {
        usarSessaoLocal();
        return;
      }
      if (!response.ok) {
        usarSessaoLocal();
        return;
      }
      let data;
      try {
        data = JSON.parse(texto);
      } catch {
        usarSessaoLocal();
        return;
      }
      if (data.logado && data.usuario) {
        sessionStorage.setItem("usuario", JSON.stringify(data.usuario));
        atualizarUILogado(data.usuario);
        preencherFormularioComUsuario(data.usuario);
      } else {
        sessionStorage.removeItem("usuario");
        atualizarUIDeslogado();
      }
    } catch {
      usarSessaoLocal();
    }
  }

  function usarSessaoLocal() {
    const cached = sessionStorage.getItem("usuario");
    if (cached) {
      try {
        const usuario = JSON.parse(cached);
        atualizarUILogado(usuario);
        preencherFormularioComUsuario(usuario);
      } catch {
        sessionStorage.removeItem("usuario");
        atualizarUIDeslogado();
      }
    } else {
      atualizarUIDeslogado();
    }
  }

  async function parseRespostaAPI(response) {
    const texto = await response.text();
    if (servidorNaoExecutaPHP(texto))
      throw new Error("Servidor não executa PHP.");
    try {
      return JSON.parse(texto);
    } catch {
      throw new Error(
        "Resposta inválida do servidor: " + texto.substring(0, 80),
      );
    }
  }

  // ============================================================
  //  MODAIS
  // ============================================================
  window.abrirModalLogin = () => {
    const modal = document.getElementById("login-modal");
    if (modal) {
      modal.style.display = "block";
      document.body.style.overflow = "hidden";
      inicializarLembrarEmail();
    }
  };

  window.abrirModalCadastro = () => {
    window.fecharModal("login-modal");
    const modal = document.getElementById("cadastro-modal");
    if (modal) {
      modal.style.display = "block";
      document.body.style.overflow = "hidden";
    }
  };

  window.fecharModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  };

  // ============================================================
  //  TOGGLE RECEPTOR
  // ============================================================
  window.toggleRecebeEntrega = function (valor) {
    const dadosReceptor = document.getElementById("dados-receptor");
    if (!dadosReceptor) return;
    dadosReceptor.style.display = valor === "outro" ? "block" : "none";
    const nome = document.getElementById("receptor-nome");
    const tel = document.getElementById("receptor-telefone");
    if (nome) nome.required = valor === "outro";
    if (tel) tel.required = valor === "outro";
  };

  // ============================================================
  //  LOGIN / CADASTRO / LOGOUT
  // ============================================================
  window.fazerLogin = async (event) => {
    event.preventDefault();
    const email = document.getElementById("login-email")?.value?.trim();
    const senha = document.getElementById("login-senha")?.value;
    const lembrar = document.getElementById("lembrar-email")?.checked;
    if (!email || !senha) {
      mostrarToast("Preencha e-mail e senha", "error");
      return;
    }

    const btn = event.target.querySelector('button[type="submit"]');
    const textoOriginal = btn?.innerHTML;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Entrando...';
    }

    try {
      const response = await fetch(
        `${window.API_BASE_URL}/usuarios/login.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha }),
        },
      );
      const data = await parseRespostaAPI(response);
      if (data.success && data.usuario) {
        if (lembrar) localStorage.setItem("ng_email_salvo", email);
        else localStorage.removeItem("ng_email_salvo");
        sessionStorage.setItem("usuario", JSON.stringify(data.usuario));
        atualizarUILogado(data.usuario);
        preencherFormularioComUsuario(data.usuario);
        window.fecharModal("login-modal");
        mostrarToast(
          `Bem-vindo, ${data.usuario.nome?.split(" ")[0]}!`,
          "success",
        );
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 800);
      } else {
        mostrarToast(data.message || "E-mail ou senha incorretos", "error");
      }
    } catch (error) {
      mostrarToast("Não foi possível conectar ao servidor", "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
      }
    }
  };

  window.fazerCadastro = async (event) => {
    event.preventDefault();
    const nome = document.getElementById("cadastro-nome")?.value?.trim();
    const email = document.getElementById("cadastro-email")?.value?.trim();
    const telefone = document
      .getElementById("cadastro-telefone")
      ?.value?.trim();
    const senha = document.getElementById("cadastro-senha")?.value;
    const confirmar = document.getElementById(
      "cadastro-confirmar-senha",
    )?.value;

    if (!nome || !email || !telefone || !senha) {
      mostrarToast("Preencha todos os campos", "error");
      return;
    }
    if (senha.length < 6) {
      mostrarToast("A senha deve ter no mínimo 6 caracteres", "error");
      return;
    }
    if (senha !== confirmar) {
      mostrarToast("As senhas não conferem", "error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      mostrarToast("E-mail inválido", "error");
      return;
    }

    const btn = event.target.querySelector('button[type="submit"]');
    const textoOriginal = btn?.innerHTML;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Cadastrando...';
    }

    try {
      const response = await fetch(
        `${window.API_BASE_URL}/usuarios/cadastrar.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, email, telefone, senha }),
        },
      );
      const data = await parseRespostaAPI(response);
      if (data.success && data.usuario) {
        sessionStorage.setItem("usuario", JSON.stringify(data.usuario));
        atualizarUILogado(data.usuario);
        preencherFormularioComUsuario(data.usuario);
        window.fecharModal("cadastro-modal");
        mostrarToast("Cadastro realizado! Seja bem-vindo!", "success");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 800);
      } else {
        mostrarToast(data.message || "Erro ao cadastrar", "error");
      }
    } catch (error) {
      mostrarToast("Não foi possível conectar ao servidor", "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
      }
    }
  };

  window.fazerLogout = async () => {
    try {
      await fetch(`${window.API_BASE_URL}/usuarios/logout.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.warn("⚠️ API de logout indisponível");
    }
    sessionStorage.removeItem("usuario");
    window.location.href = "index.html";
  };

  // ============================================================
  //  GOOGLE MAPS — INICIALIZAÇÃO
  // ============================================================
  function quandoGoogleMapsCarregar(callback) {
    if (window.__googleMapsLoaded) {
      callback();
      return;
    }
    window.addEventListener("google-maps-ready", callback, { once: true });
    let tentativas = 0;
    const check = setInterval(() => {
      tentativas++;
      if (window.__googleMapsLoaded) {
        clearInterval(check);
        callback();
      } else if (tentativas > 33) {
        clearInterval(check);
        console.warn("⚠️ Google Maps não carregou após 10s");
      }
    }, 300);
  }

  function inicializarGoogleMaps() {
    const mapEl = document.getElementById("map");
    if (!mapEl) {
      console.log("ℹ️ Elemento #map não está nesta página");
      return;
    }
    if (typeof google === "undefined" || !google.maps) {
      console.warn("⚠️ Google Maps SDK não disponível");
      return;
    }
    if (googleMap) return;

    const cfg = window.GOOGLE_MAPS_CONFIG || {};
    googleMap = new google.maps.Map(mapEl, {
      center: cfg.center || { lat: -26.9906, lng: -48.6347 },
      zoom: cfg.defaultZoom || 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: cfg.styles || [],
    });

    googleDirectionsService = new google.maps.DirectionsService();
    googleDirectionsRenderer = new google.maps.DirectionsRenderer({
      map: googleMap,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#FF6B00",
        strokeWeight: 5,
        strokeOpacity: 0.85,
      },
    });
    googleGeocoder = new google.maps.Geocoder();

    googleMapsPronto = true;
    console.log("✅ Google Maps inicializado em Balneário Camboriú");
  }

  // ============================================================
  //  AUTOCOMPLETE GOOGLE PLACES
  // ============================================================
  function inicializarAutocomplete() {
    const campoColeta = document.getElementById("endereco-coleta");
    const campoEntrega = document.getElementById("endereco-entrega");
    if (!campoColeta || !campoEntrega) return;
    if (typeof google === "undefined" || !google.maps?.places) {
      console.warn("⚠️ Google Places não disponível");
      return;
    }

    const opts = {
      componentRestrictions: { country: "br" },
      fields: ["address_components", "geometry", "formatted_address", "name"],
      types: ["address"],
    };

    const acColeta = new google.maps.places.Autocomplete(campoColeta, opts);
    const acEntrega = new google.maps.places.Autocomplete(campoEntrega, opts);

    acColeta.addListener("place_changed", () => {
      const place = acColeta.getPlace();
      if (!place.geometry) return;
      window.coordenadasCache.coleta = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        endereco: place.formatted_address,
      };
      preencherNumeroAutomatico(campoColeta, place);
      adicionarMarcador("coleta", place.geometry.location);
      tentarCalcularRotaPreview();
    });

    acEntrega.addListener("place_changed", () => {
      const place = acEntrega.getPlace();
      if (!place.geometry) return;
      window.coordenadasCache.entrega = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        endereco: place.formatted_address,
      };
      preencherNumeroAutomatico(campoEntrega, place);
      adicionarMarcador("entrega", place.geometry.location);
      tentarCalcularRotaPreview();
    });

    console.log("✅ Autocomplete Google Places configurado");
  }

  function preencherNumeroAutomatico(input, place) {
    const isColeta = input.id === "endereco-coleta";
    const numEl = document.getElementById(
      isColeta ? "numero-coleta" : "numero-entrega",
    );
    if (!numEl || numEl.value) return;
    const num = place.address_components?.find((c) =>
      c.types.includes("street_number"),
    )?.short_name;
    if (num) numEl.value = num;
  }

  function adicionarMarcador(tipo, position) {
    if (markers[tipo]) markers[tipo].setMap(null);
    if (!googleMap) return;

    markers[tipo] = new google.maps.Marker({
      position,
      map: googleMap,
      title: tipo === "coleta" ? "Coleta" : "Entrega",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: tipo === "coleta" ? "#FF6B00" : "#00C48C",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 3,
      },
      label: {
        text: tipo === "coleta" ? "C" : "E",
        color: "#fff",
        fontSize: "11px",
        fontWeight: "bold",
      },
    });
  }

  function tentarCalcularRotaPreview() {
    const c = window.coordenadasCache.coleta;
    const e = window.coordenadasCache.entrega;
    if (c && e && googleDirectionsService) {
      renderizarRotaNoMapa(c, e).catch((err) =>
        console.warn("Preview rota:", err.message),
      );
    }
  }

  async function renderizarRotaNoMapa(origem, destino) {
    return new Promise((resolve, reject) => {
      googleDirectionsService.route(
        {
          origin: { lat: origem.lat, lng: origem.lng },
          destination: { lat: destino.lat, lng: destino.lng },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            googleDirectionsRenderer.setDirections(result);
            const bounds = new google.maps.LatLngBounds();
            result.routes[0].legs[0].steps.forEach((s) => {
              bounds.extend(s.start_location);
              bounds.extend(s.end_location);
            });
            googleMap.fitBounds(bounds);
            resolve(result);
          } else {
            reject(new Error("Erro ao renderizar rota: " + status));
          }
        },
      );
    });
  }

  // ============================================================
  //  GEOCÓDIGO
  // ============================================================
  function geocodificarEndereco(endereco) {
    return new Promise((resolve, reject) => {
      if (!googleGeocoder) {
        reject(new Error("Geocoder não inicializado"));
        return;
      }
      googleGeocoder.geocode(
        {
          address: endereco,
          region: "BR",
          componentRestrictions: { country: "BR" },
        },
        (results, status) => {
          if (status === "OK" && results[0]) {
            const loc = results[0].geometry.location;
            resolve({
              lat: loc.lat(),
              lng: loc.lng(),
              endereco: results[0].formatted_address,
            });
          } else {
            reject(new Error(`Endereço não encontrado: ${endereco}`));
          }
        },
      );
    });
  }

  function obterCidadeDoPonto(lat, lng) {
    const chave = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (_cidadeCache[chave]) return Promise.resolve(_cidadeCache[chave]);

    return new Promise((resolve) => {
      if (!googleGeocoder) {
        resolve(null);
        return;
      }

      googleGeocoder.geocode(
        { location: { lat, lng }, language: "pt-BR", region: "BR" },
        (results, status) => {
          if (status !== "OK" || !results[0]) {
            resolve(null);
            return;
          }

          for (const r of results) {
            const municipio = r.address_components?.find((c) =>
              c.types.includes("administrative_area_level_2"),
            );
            if (municipio) {
              const cidade = municipio.long_name;
              _cidadeCache[chave] = cidade;
              resolve(cidade);
              return;
            }
          }
          resolve(null);
        },
      );
    });
  }

  // ============================================================
  //  CÁLCULO DE DISTÂNCIA
  // ============================================================
  window.calcularDistanciaCombinado = async function (origem, destino) {
    let c = window.coordenadasCache.coleta;
    let e = window.coordenadasCache.entrega;

    if (!c && origem) {
      c = await geocodificarEndereco(origem);
      window.coordenadasCache.coleta = c;
    }
    if (!e && destino) {
      e = await geocodificarEndereco(destino);
      window.coordenadasCache.entrega = e;
    }
    if (!c || !e) throw new Error("Endereços inválidos");

    return new Promise((resolve, reject) => {
      googleDirectionsService.route(
        {
          origin: { lat: c.lat, lng: c.lng },
          destination: { lat: e.lat, lng: e.lng },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status !== "OK" || !result.routes[0]?.legs[0]) {
            reject(new Error("Não foi possível calcular a rota"));
            return;
          }
          const leg = result.routes[0].legs[0];
          const distanciaKm = leg.distance.value / 1000;
          const minutos = Math.round(leg.duration.value / 60);

          googleDirectionsRenderer.setDirections(result);

          resolve({
            distanciaKm,
            distanciaTexto: `${distanciaKm.toFixed(1)} km`,
            duracaoTexto:
              minutos < 60
                ? `${minutos} min`
                : `${Math.floor(minutos / 60)}h ${minutos % 60}min`,
          });
        },
      );
    });
  };

  // ============================================================
  //  🗺️ LINK DO GOOGLE MAPS PARA O MOTOBOY
  //  Abre direto no app nativo (Android/iOS) ou no navegador
  // ============================================================
  function gerarLinkMapsMotoboy() {
    const c = window.coordenadasCache.coleta;
    const e = window.coordenadasCache.entrega;

    let origem, destino;

    if (c && c.lat && c.lng) {
      origem = `${c.lat},${c.lng}`;
    } else if (window.orcamentoAtual?.enderecoColeta) {
      origem = window.orcamentoAtual.enderecoColeta;
    } else {
      return null;
    }

    if (e && e.lat && e.lng) {
      destino = `${e.lat},${e.lng}`;
    } else if (window.orcamentoAtual?.enderecoEntrega) {
      destino = window.orcamentoAtual.enderecoEntrega;
    } else {
      return null;
    }

    // Link universal do Google Maps — abre app nativo automaticamente
    return (
      `https://www.google.com/maps/dir/?api=1` +
      `&origin=${encodeURIComponent(origem)}` +
      `&destination=${encodeURIComponent(destino)}` +
      `&travelmode=driving`
    );
  }
  window.gerarLinkMapsMotoboy = gerarLinkMapsMotoboy;

  // Link individual para o app nativo (Android/iOS), usado para botão "Abrir no app"
  function gerarDeepLinkNativo() {
    const c = window.coordenadasCache.coleta;
    const e = window.coordenadasCache.entrega;
    if (!c || !e || !c.lat || !e.lat) return null;
    return (
      `https://www.google.com/maps/dir/?api=1` +
      `&origin=${c.lat},${c.lng}` +
      `&destination=${e.lat},${e.lng}` +
      `&travelmode=driving`
    );
  }
  window.gerarDeepLinkNativo = gerarDeepLinkNativo;

  // ============================================================
  //  VALIDAÇÃO
  // ============================================================
  function validarFormulario() {
    const obrigatorios = [
      { id: "cliente-nome", label: "Nome completo" },
      { id: "cliente-telefone", label: "Telefone" },
      { id: "cliente-email", label: "E-mail" },
      { id: "endereco-coleta", label: "Endereço de coleta" },
      { id: "endereco-entrega", label: "Endereço de entrega" },
    ];
    for (const { id, label } of obrigatorios) {
      const campo = document.getElementById(id);
      if (!campo) continue;
      if (!campo.value?.trim()) {
        mostrarToast(`Preencha o campo: ${label}`, "error");
        campo.focus();
        campo.style.borderColor = "#dc3545";
        campo.addEventListener("input", () => (campo.style.borderColor = ""), {
          once: true,
        });
        return false;
      }
    }
    const email = document.getElementById("cliente-email")?.value;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      mostrarToast("E-mail inválido", "error");
      document.getElementById("cliente-email")?.focus();
      return false;
    }
    const coleta = document.getElementById("endereco-coleta")?.value?.trim();
    const entrega = document.getElementById("endereco-entrega")?.value?.trim();
    if (coleta && entrega && coleta.toLowerCase() === entrega.toLowerCase()) {
      mostrarToast(
        "Os endereços de coleta e entrega não podem ser iguais",
        "warning",
      );
      return false;
    }

    const quemRecebe = document.querySelector(
      'input[name="quem-recebe"]:checked',
    )?.value;
    if (quemRecebe === "outro") {
      const nomeReceptor = document
        .getElementById("receptor-nome")
        ?.value?.trim();
      const telReceptor = document
        .getElementById("receptor-telefone")
        ?.value?.trim();
      if (!nomeReceptor) {
        mostrarToast("Informe o nome de quem vai receber", "error");
        document.getElementById("receptor-nome")?.focus();
        return false;
      }
      if (!telReceptor) {
        mostrarToast("Informe o telefone de quem vai receber", "error");
        document.getElementById("receptor-telefone")?.focus();
        return false;
      }
    }
    return true;
  }

  function obterDimensoes() {
    const ids = ["comprimento", "largura", "altura", "peso"];
    const vals = ids.map((id) => {
      const el = document.getElementById(id);
      return el ? parseFloat(el.value) : NaN;
    });
    if (vals.every((v) => !isNaN(v) && v > 0))
      return {
        comprimento: vals[0],
        largura: vals[1],
        altura: vals[2],
        peso: vals[3],
      };
    return null;
  }

  // ============================================================
  //  CÁLCULO DE PREÇO — POR MUNICÍPIO
  // ============================================================
  function calcularPreco(distanciaKm, cidadeDestino, dimensoes = null) {
    const cfg = window.PRICING_CONFIG;
    const opCfg = window.OPERATION_CONFIG;
    if (!cfg || !opCfg) return 15.0;

    distanciaKm = Math.round(distanciaKm * 10) / 10;

    const cidadePrincipal = normalizarTexto(opCfg.cidadePrincipal);
    const cidadeDest = normalizarTexto(cidadeDestino);
    const ehCidadePrincipal = cidadeDest === cidadePrincipal;

    let preco;
    let motivo;

    if (ehCidadePrincipal) {
      const regra = opCfg.dentroCidadePrincipal;
      if (distanciaKm <= regra.limiteKmBase) {
        preco = regra.valorBase;
        motivo = `Base BC (≤ ${regra.limiteKmBase}km)`;
      } else {
        const kmExcedente = distanciaKm - regra.limiteKmBase;
        preco = regra.valorBase + kmExcedente * regra.valorPorKmExcedente;
        motivo = `BC: R$${regra.valorBase} + ${kmExcedente.toFixed(1)}km × R$${regra.valorPorKmExcedente}`;
      }
    } else {
      const regra = opCfg.foraCidadePrincipal;
      preco = Math.max(regra.valorMinimo, distanciaKm * regra.valorPorKm);
      motivo = `Fora de BC: ${distanciaKm.toFixed(1)}km × R$${regra.valorPorKm}`;
    }

    if (dimensoes && cfg.multiplicadorVolume) {
      const volume =
        dimensoes.comprimento * dimensoes.largura * dimensoes.altura;
      if (volume > cfg.limiteVolume)
        preco += (volume - cfg.limiteVolume) * cfg.multiplicadorVolume;
      if (dimensoes.peso > cfg.limitePeso)
        preco += (dimensoes.peso - cfg.limitePeso) * cfg.multiplicadorPeso;
    }

    preco = Math.min(Math.round(preco * 100) / 100, cfg.valorMaximo ?? 500);
    console.log("💰 Cálculo:", { cidadeDestino, distanciaKm, motivo, preco });

    return preco;
  }

  function montarEndereco(campoId, numeroId) {
    const endereco = document.getElementById(campoId)?.value?.trim() || "";
    const numero = document.getElementById(numeroId)?.value?.trim() || "";
    const compId =
      campoId === "endereco-coleta"
        ? "complemento-coleta"
        : "complemento-entrega";
    const complemento = document.getElementById(compId)?.value?.trim() || "";

    let resultado = endereco;
    if (numero) {
      const primeiraVirgula = endereco.indexOf(",");
      if (primeiraVirgula > -1) {
        resultado =
          endereco.slice(0, primeiraVirgula) +
          ", " +
          numero +
          endereco.slice(primeiraVirgula);
      } else {
        resultado = endereco + ", " + numero;
      }
    }
    if (complemento) resultado += " - " + complemento;
    return resultado;
  }

  // ============================================================
  //  CALCULAR ORÇAMENTO
  // ============================================================
  window.calcularOrcamento = async function () {
    if (!validarFormulario()) return;
    if (!googleMapsPronto) {
      mostrarToast("Aguarde, o mapa ainda está carregando...", "warning");
      return;
    }

    const btn = document.getElementById("btn-calcular");
    if (!btn) return;
    btn.style.display = "";
    const originalHTML = btn.innerHTML;
    btn.innerHTML =
      '<i class="bi bi-hourglass-split"></i> Calculando distância...';
    btn.disabled = true;

    const resultado = document.getElementById("orcamento-resultado");
    const distanciaInfo = document.getElementById("distancia-info");
    const btnConfirmar = document.getElementById("btn-confirmar");
    if (resultado) resultado.style.display = "none";
    if (distanciaInfo) distanciaInfo.style.display = "none";
    if (btnConfirmar) btnConfirmar.style.display = "none";

    try {
      const origemComNumero = montarEndereco(
        "endereco-coleta",
        "numero-coleta",
      );
      const destinoComNumero = montarEndereco(
        "endereco-entrega",
        "numero-entrega",
      );

      const veiculoRadio = document.querySelector(
        'input[name="tipo-veiculo"]:checked',
      );
      const veiculo = veiculoRadio ? veiculoRadio.value : "moto";

      window.distanciaAtual = await window.calcularDistanciaCombinado(
        origemComNumero,
        destinoComNumero,
      );

      const destinoCoords = window.coordenadasCache.entrega;
      let cidadeDestino = null;
      if (destinoCoords) {
        cidadeDestino = await obterCidadeDoPonto(
          destinoCoords.lat,
          destinoCoords.lng,
        );
      }
      console.log("📍 Cidade destino:", cidadeDestino);

      const dimensoes = obterDimensoes();
      const preco = calcularPreco(
        window.distanciaAtual.distanciaKm,
        cidadeDestino,
        dimensoes,
      );
      const quemRecebe =
        document.querySelector('input[name="quem-recebe"]:checked')?.value ||
        "eu";

      const dtexto = document.getElementById("distancia-texto");
      const dduracao = document.getElementById("duracao-texto");
      if (dtexto) dtexto.textContent = window.distanciaAtual.distanciaTexto;
      if (dduracao) dduracao.textContent = window.distanciaAtual.duracaoTexto;
      if (distanciaInfo) distanciaInfo.style.display = "block";

      const elCidade = document.getElementById("cidade-destino");
      if (elCidade) elCidade.textContent = cidadeDestino || "—";

      const c = window.coordenadasCache.coleta;
      const e = window.coordenadasCache.entrega;

      window.orcamentoAtual = {
        numeroPedido: "NG" + Date.now().toString().slice(-6),
        data: new Date().toLocaleString("pt-BR"),
        nome: document.getElementById("cliente-nome")?.value || "",
        telefone: document.getElementById("cliente-telefone")?.value || "",
        email: document.getElementById("cliente-email")?.value || "",
        tipoVeiculo: veiculo,
        enderecoColeta: origemComNumero,
        enderecoEntrega: destinoComNumero,
        cidadeDestino: cidadeDestino || "Não identificada",
        distancia: window.distanciaAtual.distanciaTexto,
        distanciaNum: window.distanciaAtual.distanciaKm,
        duracao: window.distanciaAtual.duracaoTexto,
        dimensoes: dimensoes
          ? `${dimensoes.comprimento}x${dimensoes.largura}x${dimensoes.altura}cm, ${dimensoes.peso}kg`
          : "Não informado",
        descricao:
          document.getElementById("descricao")?.value || "Não informada",
        quemRecebe,
        receptorNome:
          document.getElementById("receptor-nome")?.value?.trim() || "",
        receptorTelefone:
          document.getElementById("receptor-telefone")?.value?.trim() || "",
        // Coordenadas para o link do Maps
        coordsColeta: c ? { lat: c.lat, lng: c.lng } : null,
        coordsEntrega: e ? { lat: e.lat, lng: e.lng } : null,
        preco,
      };

      // Gera o link do Maps e guarda no orçamento
      window.orcamentoAtual.mapsLink = gerarLinkMapsMotoboy();
      console.log("🗺️ Link Maps motoboy:", window.orcamentoAtual.mapsLink);

      const totalValor = document.getElementById("total-valor");
      if (totalValor) totalValor.textContent = formatarMoeda(preco);
      if (resultado) resultado.style.display = "block";
      btn.style.display = "none";
      if (btnConfirmar) btnConfirmar.style.display = "block";
      mostrarToast("Orçamento calculado com sucesso!", "success");
    } catch (error) {
      console.error("Erro no cálculo:", error);
      mostrarToast(`Erro: ${error.message}`, "error");
      btn.style.display = "";
    } finally {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  };

  // ============================================================
  //  ENVIAR PEDIDO VIA WHATSAPP (com link do Maps para o motoboy)
  // ============================================================
  window.enviarPedidoWhatsApp = async function () {
    if (!window.orcamentoAtual) return;
    const o = window.orcamentoAtual;

    const blocoReceptor =
      o.quemRecebe === "outro"
        ? `
━━━━━━━━━━━━━━━━━━━━━
👤 *RECEPTOR*
━━━━━━━━━━━━━━━━━━━━━
📛 *Nome:* ${o.receptorNome}
📱 *Telefone:* ${o.receptorTelefone}`
        : "";

    // 🗺️ Bloco do Google Maps para o motoboy
    const blocoMaps = o.mapsLink
      ? `

━━━━━━━━━━━━━━━━━━━━━
🗺️ *ROTA PARA O MOTOBOY*
━━━━━━━━━━━━━━━━━━━━━
👉 *Clique para abrir no Google Maps:*
${o.mapsLink}

_Toque no link acima — abre direto no app de navegação_`
      : "";

    const mensagem = `🆕 *NOVO PEDIDO - N&G EXPRESS* 🆕

━━━━━━━━━━━━━━━━━━━━━
📋 *DADOS DO CLIENTE*
━━━━━━━━━━━━━━━━━━━━━
👤 *Nome:* ${o.nome}
📱 *Telefone:* ${o.telefone}
📧 *E-mail:* ${o.email}

━━━━━━━━━━━━━━━━━━━━━
🚚 *DADOS DA ENTREGA*
━━━━━━━━━━━━━━━━━━━━━
${o.tipoVeiculo === "carro" ? "🚗" : "🏍️"} *Veículo:* ${o.tipoVeiculo === "carro" ? "Carro" : "Moto"}
🏙️ *Cidade destino:* ${o.cidadeDestino}
📏 *Distância:* ${o.distancia}
⏱️ *Tempo estimado:* ${o.duracao}
💰 *Valor:* ${formatarMoeda(o.preco)}

━━━━━━━━━━━━━━━━━━━━━
📍 *COLETA*
━━━━━━━━━━━━━━━━━━━━━
${o.enderecoColeta}

━━━━━━━━━━━━━━━━━━━━━
🎯 *ENTREGA*
━━━━━━━━━━━━━━━━━━━━━
${o.enderecoEntrega}${blocoReceptor}${blocoMaps}

━━━━━━━━━━━━━━━━━━━━━
📦 *ENCOMENDA*
━━━━━━━━━━━━━━━━━━━━━
📐 *Dimensões:* ${o.dimensoes}
📝 *Descrição:* ${o.descricao}

🔖 *Pedido:* #${o.numeroPedido}
📅 *Data:* ${o.data}

✅ *Por favor, confirme este pedido.*`;

    const numeroWhats = window.WHATSAPP_CONFIG?.numero || "5547999123260";
    window.open(
      `https://wa.me/${numeroWhats}?text=${encodeURIComponent(mensagem)}`,
      "_blank",
    );

    // Salva no backend (com coordenadas e link do maps)
    const usuarioRaw = sessionStorage.getItem("usuario");
    if (usuarioRaw) {
      try {
        const usuario = JSON.parse(usuarioRaw);
        await fetch(`${window.API_BASE_URL}/orcamentos/salvar.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuario_id: usuario.id,
            numero_pedido: o.numeroPedido,
            tipo_veiculo: o.tipoVeiculo,
            endereco_coleta: o.enderecoColeta,
            endereco_entrega: o.enderecoEntrega,
            cidade_destino: o.cidadeDestino,
            dimensoes: o.dimensoes,
            peso: parseFloat(o.peso) || 0,
            descricao: o.descricao,
            valor_total: o.preco,
            distancia_km: o.distanciaNum || 0,
            coords_coleta: o.coordsColeta,
            coords_entrega: o.coordsEntrega,
            maps_link: o.mapsLink,
          }),
        });
      } catch (e) {
        console.warn("⚠️ Não foi possível salvar no histórico:", e.message);
      }
    }

    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
  };

  // ============================================================
  //  SWIPER
  // ============================================================
  function inicializarSwiper() {
    const swiperEl = document.querySelector(".hero-swiper");
    if (!swiperEl || typeof Swiper === "undefined" || swiperEl.swiper) return;
    new Swiper(".hero-swiper", {
      loop: true,
      autoplay: { delay: 5000, disableOnInteraction: false },
      pagination: { el: ".swiper-pagination", clickable: true },
      speed: 1000,
      effect: "fade",
      fadeEffect: { crossFade: true },
    });
  }

  // ============================================================
  //  SMOOTH SCROLL
  // ============================================================
  function inicializarSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        const targetId = this.getAttribute("href");
        if (!targetId || targetId === "#" || targetId === "#home") {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          const headerHeight =
            document.querySelector("header")?.offsetHeight || 0;
          window.scrollTo({
            top: target.offsetTop - headerHeight,
            behavior: "smooth",
          });
        }
      });
    });
  }

  // ============================================================
  //  INICIALIZAÇÃO
  // ============================================================
  quandoGoogleMapsCarregar(() => {
    inicializarGoogleMaps();
    inicializarAutocomplete();
  });

  verificarSessao();
  aplicarMascaraTelefone();
  atualizarAno();
  inicializarSwiper();
  inicializarSmoothScroll();

  const header = document.querySelector("header");
  if (header)
    window.addEventListener("scroll", () =>
      header.classList.toggle("scrolled", window.scrollY > 50),
    );

  const backToTop = document.querySelector(".back-to-top");
  if (backToTop) {
    window.addEventListener("scroll", () => {
      backToTop.style.display = window.pageYOffset > 300 ? "flex" : "none";
    });
    backToTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" }),
    );
  }

  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener("click", () =>
      navLinks.classList.toggle("active"),
    );
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => navLinks.classList.remove("active"));
    });
  }

  document
    .getElementById("btn-calcular")
    ?.addEventListener("click", window.calcularOrcamento);
  document
    .getElementById("btn-confirmar")
    ?.addEventListener("click", window.enviarPedidoWhatsApp);

  window.addEventListener("click", (e) => {
    if (e.target.classList?.contains("modal")) window.fecharModal(e.target.id);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal").forEach((m) => {
        if (m.style.display === "block") window.fecharModal(m.id);
      });
    }
  });
});
