// BioVault Service Worker - PWA + プッシュ通知

const CACHE_NAME = "biovault-v1";
const OFFLINE_URL = "/dashboard";

// インストール時：オフラインフォールバック用のキャッシュ
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        "/logo_home.png",
        "/logo.png",
        "/logo_white.png",
      ]);
    })
  );
  self.skipWaiting();
});

// アクティベーション：古いキャッシュを削除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// フェッチ：ネットワーク優先、失敗時はキャッシュ
self.addEventListener("fetch", (event) => {
  // API呼び出しやPOSTリクエストはスキップ
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((cached) => {
        return cached || caches.match(OFFLINE_URL);
      });
    })
  );
});

// プッシュ通知の受信
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "BioVault";
  const options = {
    body: data.body || "新しい更新があります",
    icon: "/logo_home.png",
    badge: "/logo_home.png",
    data: {
      url: data.url || "/dashboard",
    },
    tag: "biovault-update",
    renotify: true,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 通知クリック時にページを開く
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
