// ----------------------
// Initialize Autodesk Tandem Viewer
// ----------------------
async function initializeTandemViewer() {
  try {
    const tokenRes = await fetch('/api/auth/token');
    if (!tokenRes.ok) throw new Error(`Token endpoint failed: ${tokenRes.status}`);
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('No access token received');

    const container = document.getElementById('viewerContainer');
    window.tandemViewerInstance = await new TandemViewer(container, tokenData.access_token);
    console.log('Viewer initialized successfully.');

    // Populate model dropdown
    await populateModelSelect();

  } catch (err) {
    console.error('Failed to initialize viewer:', err);
    alert('Falha ao inicializar o viewer. Veja console para detalhes.');
  }
}

// ----------------------
// Populate model dropdown
// ----------------------
async function populateModelSelect() {
  const select = document.getElementById('modelSelect');
  select.innerHTML = '<option value="" disabled selected>Carregando...</option>';
  select.disabled = true;

  try {
    const res = await fetch('/api/projects', { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
    const data = await res.json();
    const projects = data.projects || [];

    if (!projects.length) {
      select.innerHTML = '<option value="" disabled>Nenhum projeto disponível</option>';
      return;
    }

    select.innerHTML = '<option value="" disabled selected>Selecione um modelo</option>';
    projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.dataset.twinId = project.twinId;
      option.dataset.building = project.name;
      option.textContent = project.name;
      select.appendChild(option);
    });

    select.disabled = false;
    document.getElementById('loadModelBtn').disabled = false;

  } catch (err) {
    console.error('Failed to load projects:', err);
    select.innerHTML = '<option value="" disabled>Erro ao carregar projetos</option>';
    alert('Não foi possível carregar os modelos disponíveis.');
  }
}

// ----------------------
// Initialize
// ----------------------
window.addEventListener("DOMContentLoaded", () => {
  initializeTandemViewer();

  // Attach button handler here so it always works
  const loadBtn = document.getElementById('loadModelBtn');
  if (loadBtn) loadBtn.onclick = loadSelectedModel;
});
