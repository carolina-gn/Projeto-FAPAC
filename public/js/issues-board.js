// ----------------------
// UTILS
// ----------------------
function statusDotClass(status) {
  return {
    aberta: "issue-dot--open",
    em_progresso: "issue-dot--progress",
    resolvida: "issue-dot--resolved",
    fechada: "issue-dot--closed"
  }[status] || "issue-dot--open";
}

function priorityBadgeClass(priority) {
  return {
    critica: "issue-badge--critical",
    alta: "issue-badge--high",
    media: "issue-badge--medium",
    baixa: "issue-badge--low"
  }[priority] || "issue-badge--medium";
}

function priorityLabel(priority) {
  return {
    critica: "Crítica",
    alta: "Alta",
    media: "Média",
    baixa: "Baixa"
  }[priority] || priority || "";
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function issueButtonHtml(issue) {
  const status = (issue.status || "").trim();
  const priority = (issue.priority || "").trim();
  const dot = statusDotClass(status);
  const badgeClass = priorityBadgeClass(priority);
  const badgeText = priorityLabel(priority);
  const meta = buildIssueMeta(issue);
  const title = issue.title || "";

  return `
    <button class="issue-item" type="button" data-id="${issue._id}">
      <span class="issue-dot ${dot}"></span>
      <div class="issue-main">
        <div class="issue-title" title="${escapeHtml(title)}">${escapeHtml(title)}</div>
        <div class="issue-meta">${escapeHtml(meta)}</div>
      </div>
      <span class="issue-badge ${badgeClass}">${escapeHtml(badgeText)}</span>
    </button>
  `;
}

function setCount(id, n) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(n);
}

function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleString("pt-PT");
}

// ----------------------
// BOARD RENDER
// ----------------------
function renderBoard(issues) {
  const columns = {
    aberta: [],
    em_progresso: [],
    resolvida: [],
    fechada: []
  };

  for (const i of issues) {
    const s = (i.status || "").trim();
    if (columns[s]) columns[s].push(i);
    else columns.aberta.push(i); // fallback
  }

  const byUpdatedDesc = (a, b) => {
    const da = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const db = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return db - da;
  };

  ["aberta","em_progresso","resolvida","fechada"].forEach(status => {
    columns[status].sort(byUpdatedDesc);
  });

  const lists = {
    aberta: document.getElementById("listOpen"),
    em_progresso: document.getElementById("listProgress"),
    resolvida: document.getElementById("listResolved"),
    fechada: document.getElementById("listClosed")
  };

  Object.entries(lists).forEach(([status, el]) => {
    if (el) el.innerHTML = columns[status].map(issueButtonHtml).join("");
  });

  setCount("countOpen", columns.aberta.length);
  setCount("countProgress", columns.em_progresso.length);
  setCount("countResolved", columns.resolvida.length);
  setCount("countClosed", columns.fechada.length);
}

// ----------------------
// BUILDING POPULATION
// ----------------------
function populateBuildingFilter(selectEl, issues) {
  if (!selectEl || !Array.isArray(issues)) return;

  const buildings = [...new Set(issues.map(i => i?.location?.building).filter(Boolean))];

  selectEl.innerHTML = '<option value="all" selected>Todos</option>';
  buildings.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b;
    opt.textContent = b;
    selectEl.appendChild(opt);
  });
}

function populateBuildingModal(selectEl, issues, currentBuilding) {
  if (!selectEl || !Array.isArray(issues)) return;

  const buildings = [...new Set(issues.map(i => i?.location?.building).filter(Boolean))];

  selectEl.innerHTML = '<option value="">—</option>';
  buildings.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b;
    opt.textContent = b;
    selectEl.appendChild(opt);
  });

  if (currentBuilding) selectEl.value = currentBuilding;
}

// ----------------------
// FILTERS
// ----------------------
function applyBuildingFilter(allIssues) {
  const select = document.getElementById("buildingFilter");
  const val = select ? select.value : "all";
  if (!val || val === "all") return allIssues;
  return allIssues.filter(i => (i?.location?.building || "") === val);
}

// ----------------------
// MODAL
// ----------------------
let CURRENT_MODAL_ISSUE_ID = null;
let IS_EDIT_MODE = false;
let MODAL_SNAPSHOT = null;

function findIssueById(id) {
  const all = window.__ALL_ISSUES__ || [];
  return all.find(i => String(i._id) === String(id));
}

function openIssueModal(issue) {
  CURRENT_MODAL_ISSUE_ID = issue?._id ? String(issue._id) : null;
  IS_EDIT_MODE = false;
  MODAL_SNAPSHOT = JSON.parse(JSON.stringify(issue || {}));
  renderModal(issue, false);
  document.getElementById("issueModalBackdrop")?.classList.add("is-open");
}

function renderModal(issue, editable) {
  const grid = document.getElementById("issueModalGrid");
  if (!grid) return;

  const building = issue?.location?.building || "";
  const floor = issue?.location?.floor || "";
  const space = issue?.location?.space || "";
  const element = issue?.modelLink?.element || "";

  const fieldHtml = (label, value, inputHtml) => `
    <div class="modal-field">
      <div class="modal-label">${escapeHtml(label)}</div>
      ${editable ? inputHtml : `<div class="modal-value">${escapeHtml(value || "—")}</div>`}
    </div>
  `;

  grid.innerHTML = [
    fieldHtml("Edifício", building, `<select class="form-input" id="modal_location_building"></select>`),
    fieldHtml("Piso", floor, `<select class="form-input" id="modal_location_floor"></select>`),
    fieldHtml("Espaço", space, `<input class="form-input" id="modal_location_space" value="${escapeHtml(space)}" />`),
    fieldHtml("Elemento", element, `<input class="form-input" id="modal_modelLink_element" value="${escapeHtml(element)}" />`),
    fieldHtml("Criado em", formatDate(issue?.createdAt), `<div class="modal-value">${escapeHtml(formatDate(issue?.createdAt))}</div>`),
    fieldHtml("Atualizado em", formatDate(issue?.updatedAt), `<div class="modal-value">${escapeHtml(formatDate(issue?.updatedAt))}</div>`),
  ].join("");

  // populate dynamic building dropdown
  populateBuildingModal(document.getElementById("modal_location_building"), window.__ALL_ISSUES__, building);
}

// ----------------------
// LOAD BOARD
// ----------------------
async function loadBoard() {
  try {
    const res = await fetch("/api/projects/issues");
    if (!res.ok) throw new Error("Failed to fetch issues");
    const issuesData = await res.json();

    window.__ALL_ISSUES__ = issuesData;
    populateBuildingFilter(document.getElementById("buildingFilter"), issuesData);
    renderBoard(applyBuildingFilter(issuesData));
  } catch (err) {
    console.error(err);
    alert("Falha ao carregar issues.");
  }
}

// ----------------------
// INIT
// ----------------------
window.addEventListener("DOMContentLoaded", () => {
  loadBoard();

  document.getElementById("buildingFilter")?.addEventListener("change", () => {
    renderBoard(applyBuildingFilter(window.__ALL_ISSUES__ || []));
  });

  document.getElementById("clearBuildingFilter")?.addEventListener("click", () => {
    const filter = document.getElementById("buildingFilter");
    if (filter) filter.value = "all";
    renderBoard(window.__ALL_ISSUES__ || []);
  });

  document.addEventListener("click", e => {
    const btn = e.target.closest(".issue-item");
    if (!btn) return;
    const issue = findIssueById(btn.dataset.id);
    if (issue) openIssueModal(issue);
  });

  document.getElementById("issueModalClose")?.addEventListener("click", () => {
    document.getElementById("issueModalBackdrop")?.classList.remove("is-open");
  });

  window.addEventListener("issue:created", (e) => {
  // aceita vários formatos: {detail: issue} ou {detail: {issue: issue}}
  const created = e?.detail?.issue || e?.detail;
  if (!created) return;

  // indicador visual (para sabermos que o evento chegou)
  const badge = document.getElementById("countOpen");
  if (badge) badge.title = "Evento issue:created recebido ✅";

  // garante array
  const all = Array.isArray(window.__ALL_ISSUES__) ? window.__ALL_ISSUES__ : [];

  // normaliza status caso venha com maiúsculas
  if (created.status) {
    const s = String(created.status).toLowerCase().trim();
    created.status = (s === "em progresso") ? "em_progresso" : s;
  }

  // evita duplicados
  const idx = all.findIndex(i => String(i._id) === String(created._id));
  if (idx >= 0) all[idx] = created;
  else all.unshift(created);

  window.__ALL_ISSUES__ = all;

  // re-render com filtro atual
  renderBoard(applyBuildingFilter(all));
});

});