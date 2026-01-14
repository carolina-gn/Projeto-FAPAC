let ALL_ISSUES = [];

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
// Render issues list
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
async function loadIssues() {
    try {
        const res = await fetch("/api/issues");
        const data = await res.json();
        ALL_ISSUES = Array.isArray(data) ? data : [];
        renderIssues(ALL_ISSUES);
    } catch (err) {
        console.error(err);
        alert("Não foi possível carregar as issues do backend.");
    }
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
        window.tandemViewerInstance.highlightByElementId(elementId);
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

function applyFilters() {
  const statuses = getCheckedValues("status");
  const priorities = getCheckedValues("priority");
  const types = getCheckedValues("type");
  const buildings = getCheckedValues("building");
  const floors = getCheckedValues("floor");
  const assignees = getCheckedValues("assignedToName");

  const filtered = ALL_ISSUES.filter((issue) => {
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

  // fechar o painel de filtros (opcional)
  const details = document.querySelector(".filters-sheet");
  if (details) details.open = false;
}

function clearFilters() {
  document.querySelectorAll('.filters-panel input[type="checkbox"]').forEach(cb => cb.checked = false);
  renderIssues(ALL_ISSUES);

  const details = document.querySelector(".filters-sheet");
  if (details) details.open = false;
}

// ----------------------
// Init
// ----------------------
window.addEventListener("DOMContentLoaded", () => {
  loadIssues();

  document.getElementById("filtersApplyBtn")?.addEventListener("click", applyFilters);
  document.getElementById("filtersClearBtn")?.addEventListener("click", clearFilters);

  document.querySelector(".filters-close")?.addEventListener("click", () => {
    const details = document.querySelector(".filters-sheet");
    if (details) details.open = false;
  });
});