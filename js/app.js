/**
 * ============================================================================
 * SOMA - INTERACCIÓN DE USUARIO Y EXPERIENCIA VISUAL (app.js)
 * ============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  // Elementos del DOM
  const counterValueEl = document.getElementById("counter-value");
  const stickyCounterValueEl = document.getElementById("sticky-counter-value");
  const ctaButton = document.getElementById("cta-interest-btn");
  const stickyCtaButton = document.getElementById("sticky-interest-btn");
  const confirmationBanner = document.getElementById("confirmation-banner");
  const connectionStatusEl = document.getElementById("connection-status");
  const stickyBarEl = document.getElementById("sticky-bar");
  const heroImageContainer = document.getElementById("hero-image-container");
  const modeToggles = document.querySelectorAll(".mode-toggle-btn");
  const modeDescriptionEl = document.getElementById("mode-description");

  // Estado interno de la UI
  let displayedCount = 0;
  const counterService = window.somaCounterService;

  /**
   * Animación fluida de conteo numérico (Rolling odometer con aceleración/desaceleración)
   */
  function animateNumber(element, start, end, duration = 900) {
    if (!element) return;
    if (start === end) {
      element.textContent = end.toLocaleString("es-ES");
      return;
    }

    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing cúbico inverso (easeOutCubic)
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * ease);

      element.textContent = current.toLocaleString("es-ES");

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = end.toLocaleString("es-ES");
        // Micro-animación de pulso al terminar
        element.classList.add("scale-pop");
        setTimeout(() => element.classList.remove("scale-pop"), 350);
      }
    }

    requestAnimationFrame(update);
  }

  /**
   * Actualiza todos los contadores visibles de la página de forma fluida
   */
  function updateCounters(newCount, { isInitial = false } = {}) {
    if (isInitial || displayedCount === 0) {
      if (counterValueEl) counterValueEl.textContent = newCount.toLocaleString("es-ES");
      if (stickyCounterValueEl) stickyCounterValueEl.textContent = newCount.toLocaleString("es-ES");
      displayedCount = newCount;
    } else if (newCount !== displayedCount) {
      const prev = displayedCount;
      displayedCount = newCount;
      animateNumber(counterValueEl, prev, newCount);
      animateNumber(stickyCounterValueEl, prev, newCount);
    }
  }

  /**
   * Cambia el botón principal y secundario al estado "¡Gracias! Interés registrado"
   */
  function setButtonsConfirmedState(alreadyVoted = false) {
    const buttons = [ctaButton, stickyCtaButton].filter(Boolean);

    buttons.forEach(btn => {
      btn.disabled = true;
      btn.classList.add("btn-confirmed");
      btn.setAttribute("aria-disabled", "true");
      btn.innerHTML = `
        <svg class="check-icon" viewBox="0 0 20 20" fill="currentColor" width="18" height="18" aria-hidden="true">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        <span>¡Gracias! Interés registrado</span>
      `;
    });

    if (confirmationBanner) {
      confirmationBanner.classList.remove("hidden");
      confirmationBanner.classList.add("visible");
      
      const bannerSubtext = confirmationBanner.querySelector(".banner-subtext");
      if (bannerSubtext && alreadyVoted) {
        bannerSubtext.textContent = "Tu interés en Soma ya estaba registrado en este navegador. Serás de los primeros en acceder.";
      }
    }
  }

  /**
   * Manejador del clic del botón "Me interesa"
   */
  async function handleInterestClick(event) {
    if (event) event.preventDefault();

    if (counterService.hasUserVoted()) {
      setButtonsConfirmedState(true);
      return;
    }

    // Efecto de vibración háptica ligera en dispositivos móviles compatibles
    if ("vibrate" in navigator) {
      try { navigator.vibrate(20); } catch (e) {}
    }

    // Deshabilitar temporalmente para prevenir doble clic instantáneo
    if (ctaButton) ctaButton.disabled = true;
    if (stickyCtaButton) stickyCtaButton.disabled = true;

    // Llamada al servicio modular
    const result = await counterService.registerInterest();

    // Actualizar estado a confirmado
    setButtonsConfirmedState(false);

    // Si hubo éxito, actualizar contador con animación de salto
    if (result && result.count) {
      updateCounters(result.count);
    }
  }

  // Vincular eventos a los botones
  if (ctaButton) {
    ctaButton.addEventListener("click", handleInterestClick);
  }
  if (stickyCtaButton) {
    stickyCtaButton.addEventListener("click", handleInterestClick);
  }

  /**
   * Suscribir la UI a los cambios del servicio de conteo
   */
  counterService.onCountChange((count, meta) => {
    updateCounters(count, meta);
  });

  /**
   * Inicializar servicio y verificar si el usuario ya votó previamente
   */
  async function initializeApp() {
    // Si el usuario ya había votado en visitas anteriores, reflejarlo de inmediato
    if (counterService.hasUserVoted()) {
      setButtonsConfirmedState(true);
    }

    // Cargar datos
    const initData = await counterService.init();
    if (initData && initData.count) {
      updateCounters(initData.count, { isInitial: true });
    }

    if (initData.hasVoted) {
      setButtonsConfirmedState(true);
    }

    // Indicar estado de sincronización de manera sutil y elegante
    if (connectionStatusEl) {
      if (initData.mode === "backend") {
        connectionStatusEl.textContent = "● Sincronizado en tiempo real";
        connectionStatusEl.classList.add("status-online");
      } else {
        connectionStatusEl.textContent = "● Contador activo";
        connectionStatusEl.classList.add("status-local");
      }
    }

    // Iniciar polling si hay backend configurado
    counterService.startLivePolling();
  }

  /**
   * Control de la barra fija inferior en scroll (Sticky CTA para móvil/escritorio)
   */
  function handleScroll() {
    if (!ctaButton || !stickyBarEl) return;
    const rect = ctaButton.getBoundingClientRect();
    // Cuando el botón de hero desaparece de la vista superior
    if (rect.bottom < 0) {
      stickyBarEl.classList.add("sticky-active");
    } else {
      stickyBarEl.classList.remove("sticky-active");
    }
  }

  window.addEventListener("scroll", handleScroll, { passive: true });

  /**
   * Selector interactivo de modos de la mochila (Tote vs Mochila vs Detalles)
   */
  const modeData = {
    tote: {
      title: "Modo Tote Urbano",
      desc: "Llévala con elegancia al hombro o de la mano en juntas, cafés y traslados ejecutivos. Las correas de mochila quedan completamente ocultas tras el panel posterior magnético.",
      highlightPin: "pin-handles"
    },
    backpack: {
      title: "Modo Mochila Ergonómica",
      desc: "Extiende las correas con acolchado de memoria en 3 segundos. Distribuye el peso de tu laptop y equipo de viaje protegiendo tu postura en traslados largos o bicicleta.",
      highlightPin: "pin-straps"
    },
    organization: {
      title: "Compartimentos Inteligentes",
      desc: "Bolsillo suspendido para laptop de 16\", compartimento oculto antirrobo en la espalda, bolsillo magnético lateral para termo y organizador técnico de cables.",
      highlightPin: "pin-pocket"
    }
  };

  modeToggles.forEach(button => {
    button.addEventListener("click", () => {
      modeToggles.forEach(b => b.classList.remove("active"));
      button.classList.add("active");

      const mode = button.dataset.mode;
      const data = modeData[mode];

      if (data && modeDescriptionEl) {
        modeDescriptionEl.style.opacity = "0";
        setTimeout(() => {
          modeDescriptionEl.innerHTML = `<strong>${data.title}:</strong> ${data.desc}`;
          modeDescriptionEl.style.opacity = "1";
        }, 150);
      }

      // Micro-efecto en el contenedor de imagen
      if (heroImageContainer) {
        heroImageContainer.classList.add("mode-transition");
        setTimeout(() => heroImageContainer.classList.remove("mode-transition"), 300);
      }
    });
  });

  // Ejecutar arranque
  initializeApp();
});
