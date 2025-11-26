// src/routes/tandem-auth.js
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

router.get('/api/tandem/token', async (req, res) => {
    try {
        const clientId = process.env.APS_CLIENT_ID;
        const clientSecret = process.env.APS_CLIENT_SECRET;

        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('scope', 'tandem:read');

        const response = await fetch('https://developer.api.autodesk.com/authentication/v2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
            },
            body: params
        });

        if (!response.ok) {
            const text = await response.text();
            return res.status(response.status).send(text);
        }

        const data = await response.json();
        res.json(data);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
