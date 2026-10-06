const V = "tp-v2",
  A = [
    "./",
    "index.html",
    "manifest.json",
    "icons/icon.svg",
    "css/main.css",
    "css/prompter.css",
    "css/camera.css",
    "css/components.css",
    "js/app.js",
    "js/state.js",
    "js/i18n.js",
    "js/storage.js",
    "js/prompterEngine.js",
    "js/cameraEngine.js",
    "js/pipEngine.js",
    "js/voiceEngine.js",
    "js/components/editor.js",
    "js/components/toolbar.js",
    "js/components/scriptList.js",
  ];
self.addEventListener("install", (e) =>
  e.waitUntil(
    caches
      .open(V)
      .then((c) => c.addAll(A))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((k) =>
        Promise.all(k.filter((x) => x !== V).map((x) => caches.delete(x))),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(
      (r) =>
        r ||
        fetch(e.request)
          .then((n) => {
            const c = n.clone();
            caches.open(V).then((ca) => ca.put(e.request, c));
            return n;
          })
          .catch(() => caches.match("index.html")),
    ),
  );
});
