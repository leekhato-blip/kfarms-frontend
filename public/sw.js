<<<<<<< HEAD
async function clearLegacyCaches() {
  const cacheKeys = await caches.keys();
  await Promise.all(
    cacheKeys.map((key) => caches.delete(key)),
  );
}

self.addEventListener("install", () => {
=======
const APP_SHELL_CACHE = "kfarms-app-shell-v1";
const RUNTIME_CACHE = "kfarms-runtime-v1";
const APP_SHELL_URLS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/kfarms-favicon.png",
  "/kfarms-logo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_URLS)),
  );
>>>>>>> 0babf4d (Update frontend application)
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
<<<<<<< HEAD
  event.waitUntil((async () => {
    await clearLegacyCaches();
    await self.registration.unregister();

    const clients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    await Promise.all(
      clients.map((client) =>
        typeof client.navigate === "function" ? client.navigate(client.url) : Promise.resolve(),
      ),
    );
  })());
=======
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

function isSameOriginRequest(requestUrl) {
  return requestUrl.origin === self.location.origin;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || !isSameOriginRequest(url)) {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match("/index.html");
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkPromise = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkPromise;
    }),
  );
>>>>>>> 0babf4d (Update frontend application)
});
