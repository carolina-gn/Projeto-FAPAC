async function checkAuthStatusTandem() {
    const statusEl = document.getElementById('authStatus');
    try {
        // Fetch 2-legged token from backend
        const response = await fetch('/api/tandem/token');
        if (!response.ok) throw new Error('Failed to get token');
        const data = await response.json();

        const accessToken = data.access_token;
        if (!accessToken) throw new Error('No access token returned');

        statusEl.textContent = 'Authenticated (Tandem)';
        
        // Initialize Tandem Viewer
        await initializeTandemViewer(accessToken);
        
        document.getElementById('loadModelBtn').disabled = false;

    } catch (err) {
        console.error('Tandem auth error:', err);
        statusEl.textContent = 'Not authenticated';
        document.getElementById('loadModelBtn').disabled = true;
    }
}

// Initializes Tandem Viewer
async function initializeTandemViewer(token) {
    const div = document.getElementById('viewerContainer');
    const tandem = await new tandemViewer(div, token);
    window.tandemViewerInstance = tandem; // optional global reference
}

// Run on page load
checkAuthStatusTandem();