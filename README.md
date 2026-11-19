# Soma — Landing Page de Validación de Mercado

Landing page moderna, minimalista y responsiva diseñada para validar el interés del mercado del producto **Soma**, una mochila tote convertible. Cuenta con un contador público visible en tiempo real que se incrementa al presionar el botón de llamada a la acción ("Me interesa"), con protección contra registros duplicados, animaciones fluidas y persistencia mediante backend (Google Sheets / Apps Script con `LockService` o API REST) con fallback automático en `localStorage`.

---

## 📁 Estructura del Proyecto

```text
SOMA_prod/
│
├── index.html                       # Página principal semántica y responsiva
│
├── css/
│   └── styles.css                   # Sistema de diseño minimalista editorial
│
├── js/
│   ├── config.js                    # Configuración central (endpoints, semillas, claves)
│   ├── counter-service.js           # Servicio modular de contador, huella y sincronización
│   └── app.js                       # Controlador UI, animaciones y selector de modos
│
├── assets/
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

## 🚀 Cómo Ejecutar y Probar Localmente

La landing page funciona **inmediatamente sin dependencias ni instalaciones previas**:

### Opción 1: Apertura directa
1. Haz doble clic en el archivo `index.html` o ábrelo con cualquier navegador moderno (Chrome, Edge, Safari, Firefox).
2. Verás el contador activo (inicia con la semilla por defecto configurada en `js/config.js`).
3. Haz clic en **"Me interesa"**:
   - Observa cómo el contador sube de inmediato con animación fluida.
   - El botón cambia al estado confirmado: `¡Gracias! Interés registrado` con icono de verificación y queda deshabilitado.
   - Aparece un mensaje sutil de confirmación sin alertas invasivas.
   - Si recargas la página, tu estado persistirá gracias al almacenamiento local y a la huella digital del dispositivo.

### Opción 2: Con un servidor local ligero
Si dispones de Python, Node.js o Live Server:

- **Con Python:**
  ```bash
  python -m http.server 8080
  ```
  Abre en tu navegador `http://localhost:8080`

- **Con Node.js / npx:**
  ```bash
  npx serve .
  ```

- **Con VS Code:**
  Haz clic derecho en `index.html` y selecciona **"Open with Live Server"**.

---

## ☁️ Conexión con Backend Gratuito (Google Sheets + Apps Script)

Si deseas sincronizar los clics de múltiples personas en una base de datos centralizada en tiempo real sin pagar servidores:

1. **Crea una hoja de cálculo en Google Drive:**
   - Nómbrala por ejemplo: `Soma - Métricas de Interés`.

2. **Abre el editor de scripts:**
   - En el menú superior de tu hoja de Google, ve a **Extensiones** > **Apps Script**.

3. **Copia el código backend:**
   - Borra el contenido que aparezca y pega todo el código de [`backend/google-apps-script.gs`](backend/google-apps-script.gs).

4. **Implementa como Aplicación Web:**
   - Haz clic en el botón azul **Implementar** (Deploy) > **Nueva implementación** (New deployment).
   - Tipo: **Aplicación web**.
   - Descripción: `Soma Counter API`.
   - Ejecutar como: **Yo** (tu correo).
   - Quién tiene acceso: **Cualquiera** (Anyone). *(Crucial para que los visitantes anónimos puedan registrar su interés).*
   - Haz clic en **Implementar** y autoriza los permisos requeridos.

5. **Conecta la URL en el proyecto:**
   - Copia la **URL de la aplicación web** (termina en `/exec`).
   - Abre el archivo `js/config.js` y colócala en `API_ENDPOINT`:
     ```javascript
     const SOMA_CONFIG = {
       API_ENDPOINT: "https://script.google.com/macros/s/TU_SCRIPT_ID/exec",
       // ...
     };
     ```
6. **¡Listo!** Ahora cada vez que un usuario haga clic en *"Me interesa"*, se registrará atómicamente en tu Google Sheet evitando registros duplicados gracias al `LockService` y al `visitorId`.

---

## 📸 Cómo sustituir la imagen por una fotografía real

1. Guarda tu fotografía o render de la mochila en la carpeta `assets/` con el nombre `soma-hero.jpg` (o `.png` / `.webp`).
2. Abre `index.html` y busca la línea con `id="product-hero-image"`.
3. Cambia `src="assets/soma-hero-placeholder.svg"` por `src="assets/soma-hero.jpg"`:
   ```html
   <img 
     id="product-hero-image"
     class="product-hero-image" 
     src="assets/soma-hero.jpg" 
     alt="Mochila Tote Convertible Soma">
   ```

---

## 🔒 Mecanismos de Seguridad y Deduplicación Implementados

1. **Huella Digital del Navegador (Browser Fingerprint):**
   - Combina resolución de pantalla, profundidad de color, zona horaria, idioma y entropía pseudoaleatoria persistente en `localStorage`.
2. **LockService Atómico en Backend:**
   - Previene condiciones de carrera cuando decenas de usuarios hacen clic simultáneamente en redes sociales o campañas.
3. **Manejo Amigable de Errores (Graceful Degradation):**
   - Si la conexión a internet cae o el backend tarda en responder, la UI actualiza el contador de forma optimista localmente sin romper la experiencia del visitante con `alert()` intrusivos.
