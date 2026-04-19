self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", event => {
  if (!event.data) return;

  let data = {};

  try {
    data = event.data.json();
  } catch (error) {
    console.error("Push payload inválido:", error);
  }

  const title = data.title || "Novo alerta";
  const options = {
    body: data.body || "Foi criado um novo alerta.",
    icon: "/images/logo.png",
    badge: "/images/logo.png",
    tag: data.tag || "alert",
    data: {
      url: data.url || "/",
      alertId: data.alertId || null
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then(clientsArr => {
        for (const client of clientsArr) {
          if ("focus" in client) {
            return client.focus();
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});