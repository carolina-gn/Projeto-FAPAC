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

            // ✅ Fetch Forge token and initialize viewer
            await initializeForgeViewer();

        } else {
            statusEl.textContent = 'Not authenticated';
            userNameEl.classList.add('hidden');
            loginBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
        }
    } catch (error) {
        console.error('Auth error:', error);
        document.getElementById('authStatus').textContent = 'Error';
        document.getElementById('loginBtn').classList.remove('hidden');
    }
}

async function initializeForgeViewer() {
    try {
        const tokenResponse = await fetch('/api/auth/token');
        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) {
            console.error('No access token found.');
            return;
        }

        // ✅ Call your viewer.js function
        initializeViewer(tokenData.access_token);
        console.log('Viewer initialized with Forge token.');

        // Optionally enable the Load button now that viewer is ready
        document.getElementById('loadModelBtn').disabled = false;
    } catch (err) {
        console.error('Failed to initialize viewer:', err);
    }
}

// Run the auth check on page load
checkAuthStatus();
