/**
 * ============================================================================
 * SOMA - CONFIGURACIÓN GLOBAL
 * ============================================================================
 * Si dejas `API_ENDPOINT` como una cadena vacía `""`, la aplicación funcionará
 * automáticamente en "Modo Local Fallback" usando localStorage para que puedas
 * probar toda la experiencia, animaciones y persistencia sin configurar nada.
 *
 * Para conectar tu backend real (Google Sheets / Apps Script o API REST):
 * Pega la URL generada en `API_ENDPOINT`.
 */

const SOMA_CONFIG = {
  // URL pública de despliegue en GitHub Pages
  SITE_URL: "https://taveraedwin.github.io/soma-tote/",

  // Pega aquí la URL de tu Google Apps Script Web App o tu API REST:
  // Ejemplo: "https://script.google.com/macros/s/AKfycbx.../exec"
  API_ENDPOINT: "",

  // Conteo base inicial si no hay backend conectado o es la primera ejecución
  SEED_INITIAL_COUNT: 428,

  // Intervalo de sondeo en milisegundos para sincronizar el contador global (ej. cada 30 segundos)
  SYNC_INTERVAL_MS: 30000,

  // Claves de almacenamiento local (localStorage)
  STORAGE_KEYS: {
    VISITOR_ID: "soma_device_visitor_id_v1",
    VOTED: "soma_user_expressed_interest_v1",
    OFFLINE_COUNT: "soma_fallback_counter_v1",
    VOTE_TIMESTAMP: "soma_voted_timestamp_v1"
  }
};

// Congelar para prevenir mutaciones accidentales
Object.freeze(SOMA_CONFIG);
Object.freeze(SOMA_CONFIG.STORAGE_KEYS);
