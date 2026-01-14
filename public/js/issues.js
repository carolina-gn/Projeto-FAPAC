// ----------------------
// issues.js
// ----------------------

// Globals
let ALL_ISSUES = [];
let currentProjectId = null;

// ----------------------
// Utilities
// ----------------------
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusDotClass(status) {
  return {
    aberta: "issue-dot--open",
    em_progresso: "issue-dot--progress",
    resolvida: "issue-dot--resolved",
    fechada: "issue-dot--closed"
  }[status] || "issue-dot--open";
}

function priorityLabel(p) {
  return {
    critica: "Crítica",
    alta: "Alta",
    media: "Média",
    baixa: "Baixa"
  }[p] || p;
}

function buildIssueMeta(issue) {
  const floor = issue?.location?.floor?.trim();
  const space = issue?.location?.space?.trim();
  const building = issue?.location?.building?.trim();
  const parts = [];
  if (floor) parts.push(floor);
  if (space) parts.push(space);
  else if (building) parts.push(building);
  return parts.join(" · ") || "—";
}

// ----------------------
// Find issue by ID
// ----------------------
function findIssue(id) {
    return ALL_ISSUES.find(i => String(i._id) === String(id));
}

// ----------------------
// Click issue → highlight
// ----------------------
document.addEventListener("click", e => {
    const btn = e.target.closest(".issue-item");
    if (!btn) return;

    const issue = findIssue(btn.dataset.id);
    if (!issue) return;

    const elementId = issue?.modelLink?.elementId;
    if (!elementId) {
        alert("Issue não tem elemento associado.");
        return;
    }

    if (window.tandemViewerInstance) {
        window.tandemViewerInstance.highlightByExternalId(elementId);
    } else {
        alert("Viewer não inicializado ainda.");
    }
});

// ----------------------
// Navigation (NO page reload)
// ----------------------
document.getElementById('viewAllIssues')
    ?.addEventListener('click', () => {
        if (typeof window.showIssuesBoard === "function") {
            window.showIssuesBoard();
        } else {
            console.warn("showIssuesBoard not available");
        }
    });

function getCheckedValues(name) {
  return Array.from(document.querySelectorAll(`input[type="checkbox"][name="${name}"]:checked`))
    .map(cb => cb.value);
}

// ----------------------
// Filters
// ----------------------
function applyFilters() {
  const statuses = getCheckedValues("status");
  const priorities = getCheckedValues("priority");
  const types = getCheckedValues("type");
  const buildings = getCheckedValues("building");
  const floors = getCheckedValues("floor");
  const assignees = getCheckedValues("assignedToName");

  const filtered = ALL_ISSUES.filter(issue => {
    if (statuses.length && !statuses.includes(issue.status)) return false;
    if (priorities.length && !priorities.includes(issue.priority)) return false;
    if (types.length && !types.includes(issue.type)) return false;

    const building = issue?.location?.building || "";
    const floor = issue?.location?.floor || "";
    const assigned = issue?.assignedToName || "";

    if (buildings.length && !buildings.includes(building)) return false;
    if (floors.length && !floors.includes(floor)) return false;
    if (assignees.length && !assignees.includes(assigned)) return false;

    return true;
  });

  renderIssues(filtered);
  document.querySelector(".filters-sheet")?.removeAttribute('open');
}

function clearFilters() {
  document.querySelectorAll('.filters-panel input[type="checkbox"]').forEach(cb => cb.checked = false);
  renderIssues(ALL_ISSUES);
  document.querySelector(".filters-sheet")?.removeAttribute('open');
}

// ----------------------
// Render issues
// ----------------------
function renderIssues(issues) {
  const listEl = document.getElementById("issuesList");
  if (!listEl) return;

  if (!issues || !issues.length) {
    listEl.innerHTML = `<div style="padding:10px; opacity:.6;">Sem issues</div>`;
    return;
  }

  listEl.innerHTML = issues.map(issue => `
    <button class="issue-item" type="button" data-id="${issue._id}">
      <span class="issue-dot ${statusDotClass(issue.status)}"></span>
      <div class="issue-main">
        <div class="issue-title">${escapeHtml(issue.title)}</div>
        <div class="issue-meta">${escapeHtml(buildIssueMeta(issue))}</div>
      </div>
      <span class="issue-badge">${priorityLabel(issue.priority)}</span>
    </button>
  `).join("");
}

// ----------------------
// Load issues from backend
// ----------------------
async function loadIssues(projectId) {
  if (!projectId) return;
  try {
    const res = await fetch(`/api/projects/${projectId}/issues`);
    if (!res.ok) throw new Error('Failed to fetch issues');
    const data = await res.json();
    ALL_ISSUES = Array.isArray(data) ? data : [];
    renderIssues(ALL_ISSUES);
  } catch (err) {
    console.error(err);
    alert('Erro ao carregar issues');
  }
}

// ----------------------
// Load assignees for a project
// ----------------------
async function loadProjectAssignees(projectId) {
    console.log('Loading assignees for projectId:', projectId);
    const select = document.getElementById('assignedTo');
    if (!select) return;

    select.innerHTML = '<option value="" disabled selected>Carregando...</option>';

    try {
        const res = await fetch(`/api/projects/${projectId}/users`);
        if (!res.ok) throw new Error(`Failed to fetch assignees: ${res.status}`);
        const data = await res.json();

        select.innerHTML = '<option value="" disabled selected>Selecionar</option>';

        if (Array.isArray(data.users) && data.users.length) {
            data.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id; // always use Mongo _id
                option.textContent = user.name || user.email || 'Usuário';
                select.appendChild(option);
            });
            console.log('Assignees populated:', select.options.length);
        }

    } catch (err) {
        console.error('Failed to load assignees:', err);
        select.innerHTML = '<option value="" disabled selected>Erro ao carregar</option>';
    }
}

// ----------------------
// Normalize inputs
// ----------------------
function normalizeStatus(v) {
  const s = (v || "").toLowerCase().trim();
  return {
    "aberta": "aberta",
    "em progresso": "em_progresso",
    "resolvida": "resolvida",
    "fechada": "fechada"
  }[s] || "";
}

function normalizePriority(v) {
  const s = (v || "").toLowerCase().trim();
  return {
    "baixa": "baixa",
    "media": "media",
    "média": "media",
    "alta": "alta",
    "critica": "critica",
    "crítica": "critica"
  }[s] || "";
}

function normalizeType(v) {
  const s = (v || "").toLowerCase().trim();
  return {
    "avaria": "avaria",
    "pedido": "pedido",
    "inspecao": "inspecao",
    "inspeção": "inspecao"
  }[s] || "";
}

// ----------------------
// Create issue
// ----------------------
// ----------------------
// Create issue (robust)
// ----------------------
async function createIssue() {
  if (!currentProjectId) {
    return alert('Selecione um projeto primeiro');
  }

  // Collect form fields
  const title = document.getElementById("issueTitle")?.value.trim();
  const description = document.getElementById("issueDesc")?.value.trim();
  const status = normalizeStatus(document.getElementById("issueStatus")?.value);
  const priority = normalizePriority(document.getElementById("issuePriority")?.value);
  const type = normalizeType(document.getElementById("issueType")?.value);
  const assignedTo = document.getElementById("assignedTo")?.value || null;

  // Validate required fields
  if (!title) return alert("Preencha o Título.");
  if (!status) return alert("Selecione o Estado.");
  if (!priority) return alert("Selecione a Prioridade.");
  if (!type) return alert("Selecione o Tipo.");

  // Convert selected dbId → elementId
  let elementId = '';
  const dbId = window.selectedElementId;
  if (dbId && window.tandemViewerInstance) {
    try {
      const ids = await getElementIdsFromDbIds([Number(dbId)]);
      elementId = ids[0] || '';
    } catch (err) {
      console.warn("Failed to convert dbId to elementId:", err);
    }
  }

  // Build payload
  const payload = {
    project: currentProjectId,
    title,
    description,
    status,
    priority,
    type,
    location: {
      building: document.getElementById("locBuilding")?.value.trim() || '',
      floor: document.getElementById("locFloor")?.value.trim() || '',
      space: document.getElementById("locSpace")?.value.trim() || '',
    },
    modelLink: {
      element: document.getElementById("modelElement")?.value.trim() || '',
      elementId
    },
    assignedTo
  };

  console.log("Creating issue with payload:", payload);

  // Send POST request
  try {
    const res = await fetch(`/api/projects/${currentProjectId}/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Failed to create issue:", data);
      return alert(data.error || data.message || "Erro desconhecido ao criar issue");
    }

    // Success
    ALL_ISSUES.unshift(data);   // add to local cache
    renderIssues(ALL_ISSUES);

    // Reset form
    const form = document.querySelector(".issue-form");
    if (form) form.reset();
    document.getElementById("modelElement").value = '';
    window.selectedElementId = null;

    alert("Issue criada com sucesso!");

  } catch (err) {
    console.error("Error posting issue:", err);
    alert("Erro ao criar issue: veja console.");
  }
}


// ----------------------
// Load model + assignees + issues
// ----------------------
async function loadSelectedModel() {
    const select = document.getElementById('modelSelect');
    const selectedOption = select.selectedOptions[0];
    if (!selectedOption) return alert('Selecione um modelo');

    currentProjectId = selectedOption.value;
    console.log('Selected projectId:', currentProjectId);

    // --------------------------
    // Update Edifício field
    // --------------------------
    const locBuildingSelect = document.getElementById('locBuilding');
    if (locBuildingSelect) {
      console.log('Updating locBuilding field...');
      locBuildingSelect.innerHTML = ''; // clear existing options

      const option = document.createElement('option');
      option.value = selectedOption.dataset.building;
      option.textContent = selectedOption.dataset.building;
      option.selected = true;
      option.disabled = true; // optional, if you want it read-only

      locBuildingSelect.appendChild(option);

      // Force the select to show the value
      locBuildingSelect.value = selectedOption.dataset.building;

      console.log('locBuilding updated:', locBuildingSelect.value);
    } else {
      console.warn('locBuilding select not found!');
    }

    // Load assignees and issues first
    await loadProjectAssignees(currentProjectId);
    await loadIssues(currentProjectId);

    // Open viewer last
    if (window.tandemViewerInstance) {
        const facility = {
            twinId: selectedOption.dataset.twinId,
            name: selectedOption.textContent
        };
        await window.tandemViewerInstance.openFacility(facility);
        console.log('Viewer opened for', facility.name);
    }
}

async function getElementIdsFromDbIds(dbIds) {
    if (!window.tandemViewerInstance) return [];
    const viewer = window.tandemViewerInstance.viewer;
    if (!viewer) return [];

    const model = viewer.getVisibleModels()[0]; // first visible model
    if (!model || typeof model.getElementIdsFromDbIds !== "function") return [];

    return await model.getElementIdsFromDbIds(dbIds);
}



// ----------------------
// Init
// ----------------------
window.addEventListener("DOMContentLoaded", () => {
  // Model loader
  document.getElementById('loadModelBtn').onclick = loadSelectedModel;

  // Issue creation
  document.getElementById('btnCreateIssue').onclick = createIssue;
  document.getElementById('btnCancelIssue').onclick = () => {
    const form = document.querySelector(".issue-form");
    if (form) form.reset();
    document.getElementById("modelElement").value = '';
  };

  // Filters
  document.getElementById('filtersApplyBtn')?.addEventListener('click', applyFilters);
  document.getElementById('filtersClearBtn')?.addEventListener('click', clearFilters);

  // Issue click highlights model element
  document.addEventListener("click", e => {
    const btn = e.target.closest(".issue-item");
    if (!btn) return;
    const issue = ALL_ISSUES.find(i => String(i._id) === String(btn.dataset.id));
    if (!issue) return;

    const elementId = issue?.modelLink?.elementId;
    if (!elementId) return alert("Issue não tem elemento associado.");

    if (window.tandemViewerInstance) {
      window.tandemViewerInstance.highlightByElementId(elementId);
    } else {
      alert("Viewer não inicializado ainda.");
    }
  });

  // View all issues board
  document.getElementById('viewAllIssues')?.addEventListener('click', () => {
    if (typeof window.showIssuesBoard === "function") window.showIssuesBoard();
  });
});