const express = require("express");
const router = express.Router();
const { authRefreshMiddleware } = require("../middlewares/auth.js");

router.get("/api/tandem/groups", authRefreshMiddleware, async (req, res) => {
    const token = req.internalOAuthToken.access_token;

    const response = await fetch(
        "https://developer.api.autodesk.com/tandem/api/v1/groups",
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );

    const data = await response.json();
    res.status(response.ok ? 200 : response.status).json(data);
});

router.get("/api/tandem/groups/:groupId/twins", authRefreshMiddleware, async (req, res) => {
    const token = req.internalOAuthToken.access_token;
    const { groupId } = req.params;

    const response = await fetch(
        `https://developer.api.autodesk.com/tandem/api/v1/groups/${groupId}/twins`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );

    const data = await response.json();
    res.status(response.ok ? 200 : response.status).json(data);
});