async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/profile');
        
        const statusEl = document.getElementById('authStatus');
        const userNameEl = document.getElementById('userName');
        const userNameValueEl = document.getElementById('userNameValue');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        if (response.ok) {
            const data = await response.json();
            statusEl.textContent = 'Authenticated';
            userNameValueEl.textContent = data.name;
            userNameEl.classList.remove('hidden');
            loginBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');

            // ✅ Fetch 3-legged token and initialize Tandem Viewer
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
}

async function initializeTandemViewer() {
    try {
        const tokenResponse = await fetch('/api/auth/token');
        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) {
            console.error('No access token found.');
            return;
        }

        // Initialize Tandem Viewer with the 3-legged token
        const div = document.getElementById('viewerContainer');
        const viewerInstance = new tandemViewer(div, tokenData.access_token);
        await viewerInstance.init(); // ⚠️ This is crucial
        window.tandemViewerInstance = viewerInstance;

        document.getElementById('loadModelBtn').disabled = false;
        console.log('Tandem viewer initialized.');

    } catch (err) {
        console.error('Failed to initialize Tandem viewer:', err);
    }
}

checkAuthStatus();