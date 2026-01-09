const express = require('express');
const { AuthenticationClient } = require('@aps_sdk/authentication');
const { APS_CLIENT_ID, APS_CLIENT_SECRET, PUBLIC_TOKEN_SCOPES } = require('../../config.js');

let router = express.Router();
const authenticationClient = new AuthenticationClient();

let cached = { token: null, expiresAt: 0 };

router.get('/api/auth/token', async (req, res) => {
  try {
    const now = Date.now();
    if (cached.token && now < cached.expiresAt - 60_000) {
      return res.json({ access_token: cached.token, expires_in: Math.round((cached.expiresAt - now) / 1000) });
    }

    const creds = await authenticationClient.getTwoLeggedToken(
      APS_CLIENT_ID,
      APS_CLIENT_SECRET,
      PUBLIC_TOKEN_SCOPES
    );

    cached.token = creds.access_token;
    cached.expiresAt = now + creds.expires_in * 1000;

    res.json({ access_token: creds.access_token, expires_in: creds.expires_in });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get 2-legged token' });
  }
});


module.exports = router;