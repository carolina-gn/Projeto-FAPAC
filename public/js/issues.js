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

    const elementName = issue?.modelLink?.element;
    if (!elementName) {
        alert("Issue não tem elemento associado.");
        return;
    }

    if (window.tandemViewerInstance) {
        window.tandemViewerInstance.highlightByName(elementName);
    } else {
        alert("Viewer não inicializado ainda.");
    }
});

// ----------------------
// Navigation
// ----------------------
document.getElementById('viewAllIssues')
    ?.addEventListener('click', () => {
        window.location.href = '/html/issues.html';
    });

// ----------------------
// Init
// ----------------------
window.addEventListener("DOMContentLoaded", loadIssues);