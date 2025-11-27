async function getFacilities(accessToken) {
    const url = "https://tandem.autodesk.com/api/v1/users/@me/resources";

    const resp = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        }
    });

    if (!resp.ok) {
        throw new Error(`Tandem API error (status ${resp.status})`);
    }

    return await resp.json();
}

module.exports = { getFacilities };