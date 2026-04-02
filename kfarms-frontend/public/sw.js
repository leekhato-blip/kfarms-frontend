async function clearLegacyCaches() {
  const cacheKeys = await caches.keys();
  await Promise.all(
    cacheKeys.map((key) => caches.delete(key)),
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
