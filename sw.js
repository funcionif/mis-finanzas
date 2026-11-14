// ==========================================
// SW.JS - SERVICE WORKER INTELIGENTE (v3.2.5)
// Optimizado para Safari iOS y GitHub Pages
// ==========================================

const CACHE_NAME = 'mis-finanzas-v3.3.0';

const CORE_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './core.js',
    './info.js',
    './app.js',
    './manifest.json',
    './icon.png'
];

// 1. INSTALACIÓN: Pre-caché tolerante a fallos y activación inmediata
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            await Promise.allSettled(
                CORE_ASSETS.map((asset) =>
                    cache.add(new Request(asset, { cache: 'no-cache' }))
                )
            );
        }).then(() => self.skipWaiting())
    );
});

// 2. ACTIVACIÓN: Elimina cachés de versiones anteriores
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((oldName) => caches.delete(oldName))
            );
        }).then(() => self.clients.claim())
    );
});

// 3. MENSAJES DESDE APP.JS: Permite forzar actualización al instante
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// 4. INTERCEPTOR DE RED:
// - Network-First para código y navegación (evita quedarse pegado en versiones viejas)
// - Cache-First para imágenes e íconos estáticos
self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Solo interceptar peticiones GET
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    const isNavigation = req.mode === 'navigate';
    const isCodeOrData = /\.(html|css|js|json)$/i.test(url.pathname) || url.pathname.endsWith('/');

    if (isNavigation || isCodeOrData) {
        event.respondWith(
            fetch(req, { cache: 'no-cache' })
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(req, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    const cachedResponse = await caches.match(req);
                    if (cachedResponse) return cachedResponse;
                    if (isNavigation) {
                        return caches.match('./index.html');
                    }
                    return new Response('', { status: 503, statusText: 'Offline' });
                })
        );
        return;
    }

    // Cache-First para activos multimedia (íconos, fuentes, imágenes)
    event.respondWith(
        caches.match(req).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(req).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(req, responseClone);
                    });
                }
                return networkResponse;
            });
        })
    );
});