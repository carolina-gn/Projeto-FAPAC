const express = require("express");
const router = express.Router();

const {
  getPublicVapidKey,
  saveSubscription,
  deleteSubscription
} = require("../services/pushService");

router.get("/public-key", (req, res) => {
  const publicKey = getPublicVapidKey();

  if (!publicKey) {
    return res.status(500).json({
      ok: false,
      error: "VAPID public key não configurada."
    });
  }

  res.json({
    ok: true,
    publicKey
  });
});

router.post("/subscribe", async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ ok: false, error: "Não autenticado." });
    }

    await saveSubscription({
      userId: user.id,
      subscription: req.body,
      userAgent: req.headers["user-agent"] || ""
    });

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post("/unsubscribe", async (req, res) => {
  try {
    await deleteSubscription(req.body?.endpoint);
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;