const webPush = require("web-push");
const PushSubscription = require("../models/pushSubscription");
const {
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  VAPID_SUBJECT
} = require("../../config");

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT) {
  webPush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

function getPublicVapidKey() {
  return VAPID_PUBLIC_KEY;
}

async function saveSubscription({ userId, subscription, userAgent }) {
  if (
    !subscription ||
    !subscription.endpoint ||
    !subscription.keys ||
    !subscription.keys.p256dh ||
    !subscription.keys.auth
  ) {
    throw new Error("Subscrição push inválida.");
  }

  await PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    {
      userId: String(userId),
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      },
      userAgent: userAgent || ""
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
}

async function deleteSubscription(endpoint) {
  if (!endpoint) return;
  await PushSubscription.deleteOne({ endpoint });
}

async function sendPushToAllUsers(data = {}) {
  const subscriptions = await PushSubscription.find({});

  const payload = JSON.stringify({
    title: data.title || "Novo alerta",
    body: data.body || "Foi criado um novo alerta.",
    url: data.url || "/",
    tag: data.tag || "alert",
    alertId: data.alertId || null
  });

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth
          }
        },
        payload
      );
    } catch (error) {
      console.error("Erro ao enviar push:", error.statusCode || "", error.message);

      if (error.statusCode === 404 || error.statusCode === 410) {
        await PushSubscription.deleteOne({ endpoint: sub.endpoint });
      }
    }
  }
}

module.exports = {
  getPublicVapidKey,
  saveSubscription,
  deleteSubscription,
  sendPushToAllUsers
};