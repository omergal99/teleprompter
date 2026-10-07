const V = "tp-v4",
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
// Auto-update strategy:
// - navigations + html/js/css: network-first so refresh always gets the newest
//   (fixes "need empty cache" + old HTML missing new elements like #recBadge/.seg.zoom).
// - everything else: cache-first with background refresh.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const isNav = e.request.mode === "navigate";
  const isHot =
    isNav ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".json");
  if (isHot) {
    e.respondWith(
      fetch(e.request)
        .then((n) => {
          const c = n.clone();
          caches.open(V).then((ca) => ca.put(e.request, c));
          return n;
        })
        .catch(() =>
          caches
            .match(e.request)
            .then((r) => r || caches.match("index.html")),
        ),
    );
    return;
  }
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
