# Soma — Landing Page de Validación de Mercado

[![GitHub Pages](https://img.shields.io/badge/Live%20Site-taveraedwin.github.io%2Fsoma--tote-059669?style=for-the-badge&logo=github)](https://taveraedwin.github.io/soma-tote/)
[![Status](https://img.shields.io/badge/Status-Validación%20en%20Vivo-10B981?style=for-the-badge)](https://taveraedwin.github.io/soma-tote/)
[![Stack](https://img.shields.io/badge/Frontend-Vanilla%20HTML%20%7C%20CSS%20%7C%20JS-0E0F12?style=for-the-badge)](https://taveraedwin.github.io/soma-tote/)

Landing page moderna, minimalista y responsiva diseñada para validar el interés de mercado del producto **Soma**, una mochila tote convertible. Cuenta con un contador público visible en tiempo real que se incrementa al presionar el botón de llamada a la acción ("Me interesa"), con protección contra registros duplicados, animaciones fluidas, previsualización en redes sociales (Open Graph / Twitter Cards) y persistencia dual (Google Sheets / Apps Script o fallback automático en `localStorage`).

🌐 **Sitio publicado en vivo:**  
👉 **[https://taveraedwin.github.io/soma-tote/](https://taveraedwin.github.io/soma-tote/)**

---

## 📁 Estructura del Proyecto

```text
SOMA_prod/
│
├── .nojekyll                        # Evita procesamiento Jekyll en GitHub Pages
├── 404.html                         # Página de error 404 personalizada y temática
├── index.html                       # Landing page semántica, responsive y con Open Graph
│
├── css/
│   └── styles.css                   # Sistema de diseño minimalista editorial
│
├── js/
│   ├── config.js                    # Configuración central (URL pública, endpoints, semillas)
│   ├── counter-service.js           # Servicio modular de contador, huella y sincronización
│   └── app.js                       # Controlador UI, animaciones y selector de modos
│
├── assets/
│   ├── og-image.png                 # Imagen Open Graph 1200x630 para WhatsApp, LinkedIn, X
│   ├── soma-hero-placeholder.svg     # Ilustración vectorial técnica y minimalista de Soma
│   └── README.txt                   # Instrucciones para sustituir por fotografía real
│
├── backend/
│   ├── google-apps-script.gs        # Código backend listo para Google Sheets con LockService
│   └── api-spec.md                  # Especificación REST si prefieres Node.js, FastAPI, etc.
│
└── README.md                        # Documentación y guía de puesta en marcha
```

---

## 🚀 Cómo Subir y Publicar en GitHub Pages

Para publicar tu landing page en el repositorio `taveraedwin/soma-tote` y que esté visible en **https://taveraedwin.github.io/soma-tote/**, sigue estos pasos:

### 1. Inicializar Git y vincular al repositorio
Abre tu terminal en la carpeta del proyecto y ejecuta:

```bash
git init
git branch -M main
git remote add origin https://github.com/taveraedwin/soma-tote.git
```
*(Si ya tenías el repositorio inicializado o con otro origen, usa `git remote set-url origin https://github.com/taveraedwin/soma-tote.git`)*.

### 2. Guardar cambios y subir a GitHub
```bash
git add .
git commit -m "feat: landing page Soma lista para GitHub Pages con Open Graph y contador en vivo"
git push -u origin main
```

### 3. Activar GitHub Pages en el repositorio
1. Entra a tu repositorio en GitHub: `https://github.com/taveraedwin/soma-tote`.
2. Ve a la pestaña **Settings** (Configuración) > sección lateral **Pages**.
3. En **Build and deployment** > **Branch**:
   - Selecciona la rama: **`main`**.
   - Carpeta: **`/(root)`**.
4. Haz clic en **Save** (Guardar).
5. Espera unos minutos y verás el mensaje:  
   `Your site is live at https://taveraedwin.github.io/soma-tote/`

---

## 📲 Compartir en Redes Sociales y Mensajería

El proyecto incluye metadata completa y la imagen de alta resolución `assets/og-image.png` (1200×630 px) optimizada para generar tarjetas enriquecidas (*rich preview cards*) al compartir el enlace en:
- **WhatsApp**: Muestra la miniatura de la tote Soma, título y descripción sin recortes.
- **LinkedIn / Facebook**: Genera la tarjeta con el titular "Soma — Mochila Tote Convertible" y el botón de llamada a la acción.
- **Twitter / X**: Implementa tarjeta grande `summary_large_image`.
- **Telegram / Slack / iMessage**: Vista previa instantánea con botón de enlace directo.

---

## 💻 Pruebas Locales

Si deseas probar cambios localmente antes de hacer push:

- **Con Node.js / npx:**
  ```bash
  npx serve .
  ```
- **Con Python:**
  ```bash
  python -m http.server 8080
  ```
  Abre en tu navegador: `http://localhost:8080`
- **Apertura directa:**
  Haz doble clic en `index.html`.

---

## ☁️ Conexión con Backend Gratuito (Google Sheets + Apps Script)

Por defecto, la página funciona inmediatamente en **Modo Fallback Local**, guardando el voto en `localStorage`. Si deseas que los votos de múltiples visitantes de internet se sincronicen en una hoja de Google Sheets en tiempo real:

1. Crea una hoja de cálculo en Google Drive llamada `Soma - Métricas de Interés`.
2. Ve a **Extensiones** > **Apps Script**.
3. Pega el código de [`backend/google-apps-script.gs`](backend/google-apps-script.gs).
4. Haz clic en **Implementar** > **Nueva implementación**:
   - Tipo: **Aplicación web**.
   - Ejecutar como: **Yo**.
   - Quién tiene acceso: **Cualquiera** (*Anyone*).
5. Copia la URL de la aplicación web (`https://script.google.com/macros/s/.../exec`).
6. Pégala en `API_ENDPOINT` dentro de `js/config.js`:
   ```javascript
   const SOMA_CONFIG = {
     SITE_URL: "https://taveraedwin.github.io/soma-tote/",
     API_ENDPOINT: "https://script.google.com/macros/s/TU_SCRIPT_ID/exec",
     // ...
   };
   ```
7. Haz `git commit -am "fix: endpoint Apps Script conectado"` y `git push`.

---

## 🔒 Deduplicación y Seguridad

1. **Huella digital de dispositivo (`Device Fingerprint`):** Combina entropía de resolución, zona horaria, idioma y clave local para evitar votos múltiples por navegador.
2. **LockService atómico en backend:** Control de concurrencia para soportar ráfagas simultáneas de tráfico.
3. **Optimistic UI:** La interfaz se actualiza de forma instantánea al pulsar "Me interesa", asegurando una experiencia fluida sin latencia perceptible.
