/* SPA Engineering Calculator - service worker
   Strategy: precache the app shell on install, then serve cache-first so the
   app is fully usable with no network at all, including a manual refresh. */

var CACHE = "spa-calc-v2";
var SHELL = "./index.html";

var ASSETS = [
  SHELL,
  "./",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png"
];

/* Cache each asset on its own so one bad URL (e.g. a host that does not serve
   the bare directory path) cannot abort the whole precache. The shell is the
   only mandatory entry. */
function precache(cache) {
  return cache.add(new Request(SHELL, { cache: "reload" })).then(function () {
    return Promise.all(ASSETS.slice(1).map(function (url) {
      return cache.add(new Request(url, { cache: "reload" })).catch(function () { return null; });
    }));
  });
}

self.addEventListener("install", function (ev) {
  ev.waitUntil(
    caches.open(CACHE).then(precache).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (ev) {
  ev.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("message", function (ev) {
  var data = ev.data || {};

  if (data.type === "SKIP_WAITING") { self.skipWaiting(); }

  /* Self-heal: make sure the exact URL the app was opened at is in the cache,
     whatever form it takes (/, /index.html, ?query, custom start_url). */
  if (data.type === "CACHE_PAGE" && data.url) {
    ev.waitUntil(
      caches.open(CACHE).then(function (cache) {
        return cache.match(data.url, { ignoreSearch: true }).then(function (hit) {
          if (hit) { return null; }
          return cache.add(new Request(data.url, { cache: "reload" })).catch(function () { return null; });
        }).then(function () {
          return cache.match(SHELL).then(function (hit2) {
            return hit2 ? null : precache(cache).catch(function () { return null; });
          });
        });
      })
    );
  }
});

/* Any cached copy of the app shell, tried in order of specificity. */
function shellFallback(req) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(req, { ignoreSearch: true }).then(function (a) {
      if (a) { return a; }
      return cache.match(SHELL, { ignoreSearch: true }).then(function (b) {
        if (b) { return b; }
        return cache.match("./", { ignoreSearch: true }).then(function (c) {
          if (c) { return c; }
          /* Last resort: any HTML document held in the cache. */
          return cache.keys().then(function (reqs) {
            for (var i = 0; i < reqs.length; i++) {
              if (/\.html?($|\?)/i.test(reqs[i].url) || /\/$/.test(new URL(reqs[i].url).pathname)) {
                return cache.match(reqs[i]);
              }
            }
            return null;
          });
        });
      });
    });
  });
}

function offlineNotice() {
  return new Response(
    "Offline. This page has not been saved for offline use yet. " +
    "Reconnect once and reopen the app to finish installing it.",
    { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}

self.addEventListener("fetch", function (ev) {
  var req = ev.request;
  if (req.method !== "GET") { return; }

  var url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) { return; }

  var isNavigation = req.mode === "navigate" ||
    (req.headers.get("accept") || "").indexOf("text/html") !== -1;

  /* Navigations and page refreshes: always answer from the cache first, and
     never fail - fall back through the shell to a plain offline notice. */
  if (isNavigation) {
    ev.respondWith(
      caches.match(req, { ignoreSearch: true }).then(function (hit) {
        if (hit) {
          /* Refresh the copy in the background while online. */
          ev.waitUntil(
            fetch(req).then(function (res) {
              if (res && res.ok) {
                return caches.open(CACHE).then(function (c) { return c.put(req, res.clone()); });
              }
              return null;
            }).catch(function () { return null; })
          );
          return hit;
        }
        return fetch(req).then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            ev.waitUntil(caches.open(CACHE).then(function (c) { return c.put(req, copy); }));
          }
          return res;
        }).catch(function () {
          return shellFallback(req).then(function (fb) { return fb || offlineNotice(); });
        });
      }).catch(function () {
        return shellFallback(req).then(function (fb) { return fb || offlineNotice(); });
      })
    );
    return;
  }

  /* Everything else: cache first, then network, caching each new response. */
  ev.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) { return hit; }
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          var copy = res.clone();
          ev.waitUntil(caches.open(CACHE).then(function (c) { return c.put(req, copy); }));
        }
        return res;
      }).catch(function () {
        return new Response("", { status: 504, statusText: "Offline" });
      });
    })
  );
});
