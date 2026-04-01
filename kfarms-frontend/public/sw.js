const LEGACY_CACHE_PREFIXES = ["kfarms-app-shell-", "kfarms-runtime-"];

async function clearLegacyCaches() {
  const cacheKeys = await caches.keys();
  await Promise.all(
    cacheKeys
      .filter((key) => LEGACY_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix)))
      .map((key) => caches.delete(key)),
  );
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
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
});
