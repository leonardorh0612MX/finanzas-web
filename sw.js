/* sw.js — Service worker de la PWA "Finanzas"
   Estrategia:
   - Precache del app shell (HTML + data.js + JSX + manifest + iconos)
   - /api/* → SIEMPRE red, nunca caché (datos vivos de finanzas_data.json)
   - Assets propios → red primero (refresca el caché), caché como respaldo offline
   - CDN (unpkg / Google Fonts) → caché primero (URLs versionadas e inmutables)
*/

const CACHE = "finanzas-v1";

const PRECACHE_LOCAL = [
  "/",
  "/Finanzas.html",
  "/data.js",
  "/tweaks-panel.jsx?v=2",
  "/util.jsx",
  "/charts.jsx",
  "/components.jsx",
  "/page-dashboard.jsx",
  "/page-transacciones.jsx",
  "/page-presupuestos.jsx",
  "/page-deudas.jsx",
  "/page-prestamos.jsx",
  "/page-metas.jsx",
  "/page-cuentas.jsx",
  "/page-suscripciones.jsx",
  "/page-config.jsx",
  "/app.jsx",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];

// CDN imprescindibles para arrancar la app. Se piden con mode:"cors" porque los
// <script> en Finanzas.html llevan integrity + crossorigin="anonymous": una
// respuesta opaque (no-cors) cacheada NO pasaría la verificación SRI al reusarse.
const PRECACHE_CDN = [
  "https://unpkg.com/react@18.3.1/umd/react.development.js",
  "https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js",
  "https://unpkg.com/@babel/standalone@7.29.0/babel.min.js",
];

const CDN_HOSTS = ["unpkg.com", "fonts.googleapis.com", "fonts.gstatic.com"];

function cachePut(req, res) {
  if (res && res.ok) {
    const copy = res.clone();
    caches.open(CACHE).then((cache) => cache.put(req, copy));
  }
  return res;
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(PRECACHE_LOCAL).then(() =>
          // CDN: mejor esfuerzo — si algún CDN falla, la instalación no se cancela
          Promise.allSettled(
            PRECACHE_CDN.map((url) => cache.add(new Request(url, { mode: "cors" })))
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return; // POST /api/db etc. van directo a la red

  const url = new URL(req.url);

  // API: solo red, sin caché (los datos siempre frescos)
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    e.respondWith(fetch(req));
    return;
  }

  // Navegación: red primero; shell cacheado si no hay conexión
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => cachePut(req, res))
        .catch(() => caches.match("/Finanzas.html"))
    );
    return;
  }

  // Assets propios: red primero (refresca el caché), caché como respaldo offline
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req)
        .then((res) => cachePut(req, res))
        .catch(() => caches.match(req))
    );
    return;
  }

  // CDN conocidos: caché primero (URLs versionadas); si no está, red y se guarda
  if (CDN_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => cachePut(req, res)))
    );
    return;
  }

  // Cualquier otro origen: comportamiento normal del navegador (sin interceptar)
});
