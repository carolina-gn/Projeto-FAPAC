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

  const backdrop = document.getElementById("issueModalBackdrop");
  backdrop?.classList.add("is-open");
  backdrop?.setAttribute("aria-hidden", "false");

  window.__CURRENT_PROJECT_ID__ = issue?.project || issue?.projectId || null;

}

function closeIssueModal() {
  const backdrop = document.getElementById("issueModalBackdrop");
  backdrop?.classList.remove("is-open");
  backdrop?.setAttribute("aria-hidden", "true");

  CURRENT_MODAL_ISSUE_ID = null;
  IS_EDIT_MODE = false;
  MODAL_SNAPSHOT = null;
}

function renderModal(issue, editable) {
  const grid = document.getElementById("issueModalGrid");
  const titleEl = document.getElementById("issueModalTitle");
  const descWrap = document.getElementById("issueModalDesc");
  if (!grid || !titleEl || !descWrap) return;

  titleEl.textContent = issue?.title || "Detalhes da Issue";

  const status = issue?.status || "";
  const priority = issue?.priority || "";
  const type = issue?.type || "";
  const tech = issue?.assignedToName || "";

  const building = issue?.location?.building || "";
  const floor = issue?.location?.floor || "";
  const space = issue?.location?.space || "";

  const element = issue?.modelLink?.element || "";
  const description = issue?.description?.trim() || "";

  // Descrição: leitura vs edição
  if (!editable) {
    descWrap.textContent = description || "—";
  } else {
    descWrap.innerHTML = `
      <textarea class="form-input" id="modal_description" rows="4"
        placeholder="Descrição...">${escapeHtml(description)}</textarea>
    `;
  }

  const fieldHtml = (label, value, inputHtml) => `
    <div class="modal-field">
      <div class="modal-label">${escapeHtml(label)}</div>
      ${editable ? inputHtml : `<div class="modal-value">${escapeHtml(value || "—")}</div>`}
    </div>
  `;

  grid.innerHTML = [
    fieldHtml("Estado", status, `
      <select class="form-input" id="modal_status">
        <option value="aberta" ${status==="aberta" ? "selected":""}>Aberta</option>
        <option value="em_progresso" ${status==="em_progresso" ? "selected":""}>Em progresso</option>
        <option value="resolvida" ${status==="resolvida" ? "selected":""}>Resolvida</option>
        <option value="fechada" ${status==="fechada" ? "selected":""}>Fechada</option>
      </select>
    `),

    fieldHtml("Prioridade", priorityLabel(priority) || priority, `
      <select class="form-input" id="modal_priority">
        <option value="baixa" ${priority==="baixa" ? "selected":""}>Baixa</option>
        <option value="media" ${priority==="media" ? "selected":""}>Média</option>
        <option value="alta" ${priority==="alta" ? "selected":""}>Alta</option>
        <option value="critica" ${priority==="critica" ? "selected":""}>Crítica</option>
      </select>
    `),

    fieldHtml("Tipo", type, `
      <select class="form-input" id="modal_type">
        <option value="avaria" ${type==="avaria" ? "selected":""}>Avaria</option>
        <option value="pedido" ${type==="pedido" ? "selected":""}>Pedido</option>
        <option value="inspecao" ${type==="inspecao" ? "selected":""}>Inspeção</option>
      </select>
    `),

    fieldHtml("Técnico", tech, `
      <select class="form-input" id="modal_assignedToName">
        <option value="" ${tech==="" ? "selected":""}>—</option>
        <option value="Carolina" ${tech==="Carolina" ? "selected":""}>Carolina</option>
        <option value="Leonor" ${tech==="Leonor" ? "selected":""}>Leonor</option>
        <option value="Catarina" ${tech==="Catarina" ? "selected":""}>Catarina</option>
      </select>
    `),

    fieldHtml("Edifício", building, `
      <select class="form-input" id="modal_location_building"></select>
    `),

    fieldHtml("Piso", floor, `
      <select class="form-input" id="modal_location_floor">
        <option value="" ${floor==="" ? "selected":""}>—</option>
        <option value="Piso 0" ${floor==="Piso 0" ? "selected":""}>Piso 0</option>
        <option value="Piso 1" ${floor==="Piso 1" ? "selected":""}>Piso 1</option>
        <option value="Piso 2" ${floor==="Piso 2" ? "selected":""}>Piso 2</option>
        <option value="Piso 3" ${floor==="Piso 3" ? "selected":""}>Piso 3</option>
      </select>
    `),

    fieldHtml("Espaço", space, `
      <input class="form-input" id="modal_location_space" value="${escapeHtml(space)}" />
    `),

    fieldHtml("Elemento", element, `
      <input class="form-input" id="modal_modelLink_element" value="${escapeHtml(element)}" />
    `),

    fieldHtml("Criado em", formatDate(issue?.createdAt), `<div class="modal-value">${escapeHtml(formatDate(issue?.createdAt))}</div>`),
    fieldHtml("Atualizado em", formatDate(issue?.updatedAt), `<div class="modal-value">${escapeHtml(formatDate(issue?.updatedAt))}</div>`),
  ].join("");

  // Preenche o select de edifícios dinamicamente
  populateBuildingModal(
    document.getElementById("modal_location_building"),
    window.__ALL_ISSUES__ || [],
    building
  );

  // Botões (toggle)
  const btnEdit = document.getElementById("issueModalEdit");
  const btnSave = document.getElementById("issueModalSave");
  const btnCancelEdit = document.getElementById("issueModalCancelEdit");

  if (btnEdit) btnEdit.style.display = editable ? "none" : "";
  if (btnSave) btnSave.style.display = editable ? "" : "none";
  if (btnCancelEdit) btnCancelEdit.style.display = editable ? "" : "none";
}

function enterEditMode() {
  if (!CURRENT_MODAL_ISSUE_ID) return;
  IS_EDIT_MODE = true;

  const issue = findIssueById(CURRENT_MODAL_ISSUE_ID);
  if (issue) renderModal(issue, true);
}

function cancelEditMode() {
  IS_EDIT_MODE = false;

  if (MODAL_SNAPSHOT) renderModal(MODAL_SNAPSHOT, false);
  else {
    const issue = findIssueById(CURRENT_MODAL_ISSUE_ID);
    if (issue) renderModal(issue, false);
  }
}

async function saveIssueEdits() {
  if (!CURRENT_MODAL_ISSUE_ID || !IS_EDIT_MODE) return;

  const payload = {
    status: document.getElementById("modal_status")?.value || "",
    priority: document.getElementById("modal_priority")?.value || "",
    type: document.getElementById("modal_type")?.value || "",
    assignedToName: document.getElementById("modal_assignedToName")?.value || "",
    description: document.getElementById("modal_description")?.value?.trim() || "",
    location: {
      building: document.getElementById("modal_location_building")?.value || "",
      floor: document.getElementById("modal_location_floor")?.value || "",
      space: document.getElementById("modal_location_space")?.value?.trim() || "",
    },
    modelLink: {
      element: document.getElementById("modal_modelLink_element")?.value?.trim() || "",
    }
  };

  try {
    const projectId = window.__CURRENT_PROJECT_ID__;
if (!projectId) {
  alert("Não foi possível identificar o projeto desta issue.");
  return;
}

const res = await fetch(`/api/projects/${projectId}/issues/${CURRENT_MODAL_ISSUE_ID}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});

    const data = await res.json();

    if (!res.ok) {
      console.error(data);
      alert("Erro ao guardar: " + (data.error || data.message || "desconhecido"));
      return;
    }

    // Atualiza cache
    const all = Array.isArray(window.__ALL_ISSUES__) ? window.__ALL_ISSUES__ : [];
    const idx = all.findIndex(i => String(i._id) === String(data._id));
    if (idx >= 0) all[idx] = data;
    else all.unshift(data);
    window.__ALL_ISSUES__ = all;

    // Re-render do board respeitando filtro
    renderBoard(applyBuildingFilter(all));

    // Sai de edição e atualiza snapshot
    MODAL_SNAPSHOT = JSON.parse(JSON.stringify(data));
    IS_EDIT_MODE = false;
    renderModal(data, false);

    alert("Guardado!");
  } catch (err) {
    console.error(err);
    alert("Falha de ligação ao backend ao guardar.");
  }
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

  // Clique numa issue abre modal
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".issue-item");
    if (!btn) return;
    const issue = findIssueById(btn.dataset.id);
    if (issue) openIssueModal(issue);
  });

  // Fechar modal
  document.getElementById("issueModalClose")?.addEventListener("click", closeIssueModal);
  document.getElementById("issueModalClose2")?.addEventListener("click", closeIssueModal);

  // Fechar clicando fora
  document.getElementById("issueModalBackdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "issueModalBackdrop") closeIssueModal();
  });

  // Editar / Guardar / Cancelar
  document.getElementById("issueModalEdit")?.addEventListener("click", enterEditMode);
  document.getElementById("issueModalSave")?.addEventListener("click", saveIssueEdits);
  document.getElementById("issueModalCancelEdit")?.addEventListener("click", cancelEditMode);

  // Esc fecha
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeIssueModal();
  });

  // Atualização instantânea quando crias issue no viewer
 window.addEventListener("issue:created", (e) => {
    const created = e?.detail?.issue || e?.detail;
    if (!created || !created._id) return;

    const all = Array.isArray(window.__ALL_ISSUES__) ? window.__ALL_ISSUES__ : [];
    const idx = all.findIndex(i => String(i._id) === String(created._id));
    if (idx >= 0) all[idx] = created;
    else all.unshift(created);

    window.__ALL_ISSUES__ = all;

    populateBuildingFilter(document.getElementById("buildingFilter"), all);
    renderBoard(applyBuildingFilter(all));
  });
});

