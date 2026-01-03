    try {
        const response = await fetch('/api/auth/profile');

        if (response.ok) {
            const data = await response.json();
            statusEl.textContent = 'Authenticated';
            userNameValueEl.textContent = data.name;
            userNameEl.classList.remove('hidden');
            loginBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');

            // Initialize Tandem Viewer with 3-legged token
            await initializeTandemViewer();

        } else {
            statusEl.textContent = 'Not authenticated';
            userNameEl.classList.add('hidden');
            loginBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
        }
    } catch (error) {
        console.error('Auth error:', error);
        statusEl.textContent = 'Error';
        loginBtn.classList.remove('hidden');
    }


async function initializeTandemViewer() {
    try {
        const tokenResponse = await fetch('/api/auth/token');
        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            console.error('No access token found.');
            return;
        }

        const div = document.getElementById('viewerContainer');
        // ⚠ Wait for the viewer to initialize before using
        window.tandemViewerInstance = await new tandemViewer(div, tokenData.access_token);

        document.getElementById('loadModelBtn').disabled = false;
        console.log('Tandem viewer initialized.');
    } catch (err) {
        console.error('Failed to initialize Tandem viewer:', err);
        alert('Failed to initialize viewer. Check console for details.');
    }
}

initializeTandemViewer();