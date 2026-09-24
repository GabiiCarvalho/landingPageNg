// =============================================
// CONFIGURAÇÕES GLOBAIS - N&G EXPRESS
// =============================================

// URL do backend (Railway)
window.API_BASE_URL = "https://landingpageng-production.up.railway.app/api";

// =============================================
// GOOGLE MAPS PLATFORM
// =============================================
window.GOOGLE_MAPS_CONFIG = {
  // 🔑 Cole sua chave do Google Cloud aqui
  apiKey: "AIzaSyCpVfw1Lm4hq5B9f4io2oQX49mxLyl4QNs",

  region: "BR",
  language: "pt-BR",
  libraries: "places",

  // Centro padrão (Balneário Camboriú - SC)
  center: { lat: -26.9906, lng: -48.6347 },
  defaultZoom: 13,

  // Estilo dark theme
  styles: [
    { elementType: "geometry", stylers: [{ color: "#1a1a24" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0f" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#b0b0c0" }] },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#22222f" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#12121a" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#2a2a3a" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#0d1f33" }],
    },
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
  ],
};

// =============================================
// TABELA DE PREÇOS
// =============================================
window.PRICING_CONFIG = {
  multiplicadorVolume: 0.001,
  multiplicadorPeso: 1.5,
  limiteVolume: 30000, // cm³
  limitePeso: 5, // kg
  valorMaximo: 500.0,
};

// =============================================
// REGRAS POR MUNICÍPIO
// Balneário Camboriú tem regra especial
// =============================================
window.OPERATION_CONFIG = {
  cidadePrincipal: "Balneário Camboriú",

  // Dentro de Balneário Camboriú
  dentroCidadePrincipal: {
    valorBase: 15.0, // R$ 15,00 até 7km
    limiteKmBase: 7,
    valorPorKmExcedente: 2.3, // R$ 2,30 por km excedente
  },

  // Outros municípios
  foraCidadePrincipal: {
    valorPorKm: 2.3,
    valorMinimo: 15.0,
  },
};

// =============================================
// WHATSAPP — número que recebe os pedidos
// =============================================
window.WHATSAPP_CONFIG = {
  numero: "5547999123260", // formato internacional sem +
};
