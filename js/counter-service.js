/**
 * ============================================================================
 * SOMA - SERVICIO MODULAR DE CONTADOR Y PERSISTENCIA (counter-service.js)
 * ============================================================================
 * Gestiona la sincronización con el backend (Google Apps Script / REST API)
 * y proporciona un fallback robusto con localStorage y deduplicación por huella digital.
 */

class SomaCounterService {
  constructor(config = SOMA_CONFIG) {
    this.config = config;
    this.visitorId = this._initVisitorFingerprint();
    this.listeners = new Set();
    this.currentCount = this._getLocalCount();
    this.pollTimer = null;
    this.isSyncing = false;
  }

  /**
   * Genera o recupera un ID de visitante único persistente mediante
   * una huella digital ligera (canvas hash, resolución, timezone, locale).
   */
  _initVisitorFingerprint() {
    try {
      const storedId = localStorage.getItem(this.config.STORAGE_KEYS.VISITOR_ID);
      if (storedId) return storedId;

      const screenEntropy = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
      const tzEntropy = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const langEntropy = navigator.language || "";
      const randomEntropy = Math.random().toString(36).substring(2, 10);
      const timeEntropy = Date.now().toString(36);

      // Hash básico FNV-1a para compactar la huella
      const rawString = `${screenEntropy}_${tzEntropy}_${langEntropy}_${randomEntropy}_${timeEntropy}`;
      let hash = 2166136261;
      for (let i = 0; i < rawString.length; i++) {
        hash ^= rawString.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
      }
      const uniqueId = `soma_${(hash >>> 0).toString(16)}_${randomEntropy}`;

      localStorage.setItem(this.config.STORAGE_KEYS.VISITOR_ID, uniqueId);
      return uniqueId;
    } catch (e) {
      // Fallback si cookies o localStorage están bloqueados
      return `soma_anon_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    }
  }

  /**
   * Obtiene el conteo almacenado en localStorage con fallback a la semilla inicial.
   */
  _getLocalCount() {
    try {
      const saved = localStorage.getItem(this.config.STORAGE_KEYS.OFFLINE_COUNT);
      if (saved !== null && !isNaN(parseInt(saved, 10))) {
        return parseInt(saved, 10);
      }
      localStorage.setItem(this.config.STORAGE_KEYS.OFFLINE_COUNT, this.config.SEED_INITIAL_COUNT.toString());
      return this.config.SEED_INITIAL_COUNT;
    } catch (e) {
      return this.config.SEED_INITIAL_COUNT;
    }
  }

  /**
   * Actualiza el conteo local en memoria y en localStorage.
   */
  _setLocalCount(newCount) {
    this.currentCount = Number(newCount);
    try {
      localStorage.setItem(this.config.STORAGE_KEYS.OFFLINE_COUNT, this.currentCount.toString());
    } catch (e) {
      // Ignorar si el almacenamiento privado está lleno
    }
    this._notifyListeners(this.currentCount);
  }

  /**
   * Determina si el usuario actual ya ha expresado interés previamente.
   */
  hasUserVoted() {
    try {
      return localStorage.getItem(this.config.STORAGE_KEYS.VOTED) === "true";
    } catch (e) {
      return false;
    }
  }

  /**
   * Registra el voto en el almacenamiento local.
   */
  _markAsVotedLocally() {
    try {
      localStorage.setItem(this.config.STORAGE_KEYS.VOTED, "true");
      localStorage.setItem(this.config.STORAGE_KEYS.VOTE_TIMESTAMP, new Date().toISOString());
    } catch (e) {
      console.warn("[Soma] No se pudo guardar estado de voto en localStorage:", e);
    }
  }

  /**
   * Registra un callback que se ejecuta cuando el contador cambia de valor.
   */
  onCountChange(callback) {
    if (typeof callback === "function") {
      this.listeners.add(callback);
      // Notificar de inmediato el valor actual
      callback(this.currentCount, { isInitial: true });
    }
  }

  _notifyListeners(count, meta = {}) {
    this.listeners.forEach(fn => {
      try {
        fn(count, meta);
      } catch (err) {
        console.error("[Soma] Error en listener del contador:", err);
      }
    });
  }

  /**
   * Inicializa la sincronización del contador con el backend o el fallback local.
   */
  async init() {
    // Si no hay backend configurado, operamos transparentemente en modo local
    if (!this.config.API_ENDPOINT || this.config.API_ENDPOINT.trim() === "") {
      console.info("[Soma] Modo Local Activo: usando localStorage y semilla inicial.");
      return {
        count: this.currentCount,
        hasVoted: this.hasUserVoted(),
        mode: "local"
      };
    }

    // Si hay backend configurado, consultamos el conteo en tiempo real
    return await this.fetchLiveCount();
  }

  /**
   * Consulta el contador público global desde la API / Google Apps Script.
   */
  async fetchLiveCount() {
    if (!this.config.API_ENDPOINT) {
      return { count: this.currentCount, hasVoted: this.hasUserVoted(), mode: "local" };
    }

    try {
      this.isSyncing = true;
      const url = new URL(this.config.API_ENDPOINT);
      url.searchParams.append("visitorId", this.visitorId);
      url.searchParams.append("_t", Date.now().toString()); // Evitar caché agresivo

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { "Accept": "application/json" },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data && typeof data.count === "number") {
        this._setLocalCount(data.count);
        if (data.hasVoted) {
          this._markAsVotedLocally();
        }
        return {
          count: data.count,
          hasVoted: this.hasUserVoted() || !!data.hasVoted,
          mode: "backend"
        };
      }
      throw new Error("Formato de respuesta inválido");

    } catch (error) {
      console.warn("[Soma] No se pudo sincronizar con backend, usando caché local:", error.message);
      return {
        count: this.currentCount,
        hasVoted: this.hasUserVoted(),
        mode: "local-fallback",
        error: error.message
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Registra el clic del botón "Me interesa" de manera segura y optimista.
   * Retorna un objeto con el nuevo estado.
   */
  async registerInterest() {
    // 1. Validar si ya votó localmente para evitar registros duplicados
    if (this.hasUserVoted()) {
      return {
        success: false,
        alreadyRegistered: true,
        count: this.currentCount,
        message: "Ya has registrado tu interés en este dispositivo."
      };
    }

    // 2. Incremento optimista inmediato en la UI
    const optimisticCount = this.currentCount + 1;
    this._markAsVotedLocally();
    this._setLocalCount(optimisticCount);

    // 3. Si no hay backend configurado, retornar éxito local inmediato
    if (!this.config.API_ENDPOINT || this.config.API_ENDPOINT.trim() === "") {
      return {
        success: true,
        alreadyRegistered: false,
        count: optimisticCount,
        mode: "local"
      };
    }

    // 4. Si hay backend, enviar en segundo plano
    try {
      const payload = {
        visitorId: this.visitorId,
        userAgent: navigator.userAgent || "",
        referrer: document.referrer || "Direct",
        device: window.innerWidth < 768 ? "Mobile" : "Desktop",
        timestamp: new Date().toISOString()
      };

      // Usar text/plain en fetch para evitar preflights de CORS en Google Apps Script
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(this.config.API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        if (result && typeof result.count === "number") {
          this._setLocalCount(result.count);
          return {
            success: true,
            alreadyRegistered: false,
            count: result.count,
            mode: "backend"
          };
        }
      }

      // Si el backend no respondió 200 pero no lanzó error de red grave
      return {
        success: true,
        alreadyRegistered: false,
        count: optimisticCount,
        mode: "local-optimistic"
      };

    } catch (err) {
      console.warn("[Soma] Error enviando voto al backend, mantenido localmente:", err.message);
      // No alertar al usuario; el valor optimista ya está registrado y se mantiene en localStorage
      return {
        success: true,
        alreadyRegistered: false,
        count: optimisticCount,
        mode: "offline-queued"
      };
    }
  }

  /**
   * Inicia el sondeo periódico del contador (polling suave en segundo plano)
   */
  startLivePolling() {
    if (this.pollTimer || !this.config.API_ENDPOINT) return;
    this.pollTimer = setInterval(() => {
      // Solo consultar si la pestaña del navegador está activa y visible
      if (document.visibilityState === "visible") {
        this.fetchLiveCount();
      }
    }, this.config.SYNC_INTERVAL_MS);
  }

  /**
   * Detiene el sondeo si la pestaña o componente se desmonta
   */
  stopLivePolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}

// Exportar como singleton o instancia accesible globalmente
window.somaCounterService = new SomaCounterService(SOMA_CONFIG);
