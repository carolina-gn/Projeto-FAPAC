// ----------------------
// Initialize Viewer
// ----------------------
async function initializeTandemViewer() {
    try {
        const tokenRes = await fetch('/api/auth/token');
        if (!tokenRes.ok) throw new Error(`Token endpoint failed: ${tokenRes.status}`);

        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new Error('No access token received');

        const container = document.getElementById('viewerContainer');
        window.tandemViewerInstance = await new TandemViewer(container, tokenData.access_token);

        console.log('Viewer initialized.');
        await populateModelSelect(); // populate dropdown after viewer ready
    } catch (err) {
        console.error('Failed to initialize viewer:', err);
        alert('Falha ao inicializar o viewer. Veja console.');
    }
}

// ----------------------
// Populate model dropdown
// ----------------------
async function populateModelSelect() {
    const select = document.getElementById('modelSelect');

    try {
        const res = await fetch('/api/projects', { credentials: 'same-origin' });
        if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);

        const data = await res.json();
        select.innerHTML = '<option value="" selected disabled>Selecione um modelo</option>';

        (data.projects || []).forEach(project => {
            const option = document.createElement('option');
            option.value = project._id;           // store database ID
            option.dataset.twinId = project.twinId; // store Tandem URN
            option.textContent = project.name;
            select.appendChild(option);
        });

        select.disabled = false;
        document.getElementById('loadModelBtn').disabled = false;

        // Attach click after options exist
        document.getElementById('loadModelBtn').onclick = loadSelectedModel;

    } catch (err) {
        console.error('Failed to load projects:', err);
        alert('Não foi possível carregar os modelos disponíveis.');
    }
}

// ----------------------
// Load selected model
// ----------------------
async function loadSelectedModel() {
    const select = document.getElementById('modelSelect');
    const selectedOption = select.selectedOptions[0];

    if (!selectedOption) return alert('Selecione um modelo');

    const facility = {
        twinId: selectedOption.dataset.twinId,
        name: selectedOption.textContent
    };

    if (!window.tandemViewerInstance) {
        return alert('Viewer não inicializado ainda.');
    }

    await window.tandemViewerInstance.openFacility(facility);
}

// ----------------------
// Initialize
// ----------------------
initializeTandemViewer();