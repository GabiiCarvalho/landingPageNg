// =============================================
// CONFIGURAÇÕES GLOBAIS - N&G EXPRESS
// =============================================

window.API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"
    : `${window.location.origin}/api`;

// URL do backend (Railway)
//window.API_BASE_URL = "https://landingpageng-production.up.railway.app/api";

// =============================================
// GOOGLE MAPS PLATFORM
// =============================================
window.GOOGLE_MAPS_CONFIG = {
  apiKey: "AIzaSyAifYfWzb4dhK0MnuDh0nq6jwQprj7F1jk",
  region: "BR",
  language: "pt-BR",
  libraries: "places, geometry",

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
window.OPERATION_CONFIG = {
  cidadePrincipal: "Balneário Camboriú",
  dentroCidadePrincipal: {
    valorBase: 15.0,
    limiteKmBase: 7,
    valorPorKmExcedente: 2.3,
  },
  foraCidadePrincipal: {
    valorPorKm: 2.3,
    valorMinimo: 15.0,
  },
};

// =============================================
// WHATSAPP — número que recebe os pedidos
// =============================================
window.WHATSAPP_CONFIG = {
  numero: "5547999123260",
};
