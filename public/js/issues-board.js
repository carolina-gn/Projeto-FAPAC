function statusDotClass(status) {
  if (status === "aberta") return "issue-dot--open";
  if (status === "em_progresso") return "issue-dot--progress";
  if (status === "resolvida") return "issue-dot--resolved";
  if (status === "fechada") return "issue-dot--closed";
  return "issue-dot--open";
}

function priorityBadgeClass(priority) {
  if (priority === "critica") return "issue-badge--critical";
  if (priority === "alta") return "issue-badge--high";
  if (priority === "media") return "issue-badge--medium";
  if (priority === "baixa") return "issue-badge--low";
  return "issue-badge--medium";
}

function priorityLabel(priority) {
  if (priority === "critica") return "Crítica";
  if (priority === "alta") return "Alta";
  if (priority === "media") return "Média";
  if (priority === "baixa") return "Baixa";
  return priority || "";
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

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function clearLists() {
  ["listOpen", "listProgress", "listResolved", "listClosed"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });
}

function renderBoard(issues) {
  const open = [];
  const progress = [];
  const resolved = [];
  const closed = [];

  for (const issue of issues) {
    const status = (issue.status || "").trim();
    if (status === "aberta") open.push(issue);
    else if (status === "em_progresso") progress.push(issue);
    else if (status === "resolvida") resolved.push(issue);
    else if (status === "fechada") closed.push(issue);
    else open.push(issue); // fallback
  }

  // ordena por updatedAt desc se existir
  const byUpdatedDesc = (a, b) => {
    const da = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const db = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return db - da;
  };

  open.sort(byUpdatedDesc);
  progress.sort(byUpdatedDesc);
  resolved.sort(byUpdatedDesc);
  closed.sort(byUpdatedDesc);

  const listOpen = document.getElementById("listOpen");
  const listProgress = document.getElementById("listProgress");
  const listResolved = document.getElementById("listResolved");
  const listClosed = document.getElementById("listClosed");

  if (listOpen) listOpen.innerHTML = open.map(issueButtonHtml).join("");
  if (listProgress) listProgress.innerHTML = progress.map(issueButtonHtml).join("");
  if (listResolved) listResolved.innerHTML = resolved.map(issueButtonHtml).join("");
  if (listClosed) listClosed.innerHTML = closed.map(issueButtonHtml).join("");

  setCount("countOpen", open.length);
  setCount("countProgress", progress.length);
  setCount("countResolved", resolved.length);
  setCount("countClosed", closed.length);
}

function applyBuildingFilter(allIssues) {
  const filterEl = document.getElementById("buildingFilter");
  const value = filterEl ? filterEl.value : "all";

  if (!value || value === "all") return allIssues;

  // usa location.building
  return allIssues.filter((i) => (i?.location?.building || "") === value);
}

async function loadBoard() {
  try {
    // 1) fetch all projects user can access
    const projectsRes = await fetch("/api/projects");
    const projectsData = await projectsRes.json();
    const projects = projectsData.projects || [];

    if (!projects.length) {
      window.__ALL_ISSUES__ = [];
      renderBoard([]);
      return;
    }

    // 2) fetch issues for all projects in one request
    // your backend now supports fetching all issues without projectId
    const issuesRes = await fetch("/api/projects/issues"); 
    const issuesData = await issuesRes.json();

    if (!issuesRes.ok) {
      console.error(issuesData);
      alert("Erro ao carregar issues: " + (issuesData.message || "desconhecido"));
      return;
    }

    window.__ALL_ISSUES__ = issuesData;
    const filtered = applyBuildingFilter(issuesData);
    renderBoard(filtered);
  } catch (err) {
    console.error(err);
    alert("Não foi possível ligar ao backend para carregar issues.");
  }
}

function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleString("pt-PT");
}

let CURRENT_MODAL_ISSUE_ID = null;
let IS_EDIT_MODE = false;
let MODAL_SNAPSHOT = null; // guarda valores para cancelar

function openIssueModal(issue) {
  CURRENT_MODAL_ISSUE_ID = issue?._id ? String(issue._id) : null;
  IS_EDIT_MODE = false;
  MODAL_SNAPSHOT = JSON.parse(JSON.stringify(issue || {})); // snapshot para cancelar

  renderModal(issue, false);

  const backdrop = document.getElementById("issueModalBackdrop");
  backdrop?.classList.add("is-open");
  backdrop?.setAttribute("aria-hidden", "false");
}

function renderModal(issue, editable) {
  const grid = document.getElementById("issueModalGrid");
  const titleEl = document.getElementById("issueModalTitle");
  const descWrap = document.getElementById("issueModalDesc"); // agora é um div, não texto puro
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

  // descrição: modo leitura vs edição
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
      <select class="form-input" id="modal_location_building">
        <option value="" ${building==="" ? "selected":""}>—</option>
        <option value="Palacete" ${building==="Palacete" ? "selected":""}>Palacete</option>
        <option value="BNU" ${building==="BNU" ? "selected":""}>BNU</option>
      </select>
    `),

    fieldHtml("Piso", floor, `
      <select class="form-input" id="modal_location_floor">
        <option value="" ${floor==="" ? "selected":""}>—</option>
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

  // botões: alterna visibilidade
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

  // volta ao snapshot (sem alterações)
  if (MODAL_SNAPSHOT) {
    renderModal(MODAL_SNAPSHOT, false);
  } else {
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
    const res = await fetch(`/api/issues/${CURRENT_MODAL_ISSUE_ID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(data);
      alert("Erro ao guardar: " + (data.error || "desconhecido"));
      return;
    }

    // Atualiza cache
    const all = window.__ALL_ISSUES__ || [];
    const idx = all.findIndex(i => String(i._id) === String(data._id));
    if (idx >= 0) all[idx] = data;
    else all.unshift(data);

    window.__ALL_ISSUES__ = all;

    // Re-render board respeitando filtro
    renderBoard(applyBuildingFilter(all));

    // Sair do edit mode
    MODAL_SNAPSHOT = JSON.parse(JSON.stringify(data));
    IS_EDIT_MODE = false;
    renderModal(data, false);

    alert("Guardado!");

  } catch (err) {
    console.error(err);
    alert("Falha de ligação ao backend ao guardar.");
  }
}

function closeIssueModal() {
  const backdrop = document.getElementById("issueModalBackdrop");
  if (!backdrop) return;

  backdrop.classList.remove("is-open");
  backdrop.setAttribute("aria-hidden", "true");

  CURRENT_MODAL_ISSUE_ID = null;
  IS_EDIT_MODE = false;
  MODAL_SNAPSHOT = null;
}

function findIssueById(id) {
  const all = window.__ALL_ISSUES__ || [];
  return all.find(i => String(i._id) === String(id));
}

window.addEventListener("issue:created", (e) => {
  const created = e.detail;
  if (!created || !created._id) return;

  // Atualiza a cache do board
  const all = Array.isArray(window.__ALL_ISSUES__) ? window.__ALL_ISSUES__ : [];

  // Evita duplicados (se por acaso já existir)
  const idx = all.findIndex(i => String(i._id) === String(created._id));
  if (idx >= 0) all[idx] = created;
  else all.unshift(created);

  window.__ALL_ISSUES__ = all;

  // Re-render respeitando o filtro do edifício atual
  renderBoard(applyBuildingFilter(all));
});

window.addEventListener("DOMContentLoaded", () => {
  // 1) carregar tudo
  loadBoard();

  // 2) filtro edifício
  document.getElementById("buildingFilter")?.addEventListener("change", () => {
    const all = window.__ALL_ISSUES__ || [];
    renderBoard(applyBuildingFilter(all));
  });

  // 3) limpar filtro edifício
  document.getElementById("clearBuildingFilter")?.addEventListener("click", () => {
    const filterEl = document.getElementById("buildingFilter");
    if (filterEl) filterEl.value = "all";
    const all = window.__ALL_ISSUES__ || [];
    renderBoard(all);
  });

  // 4) Delegação: clique num issue-item abre modal
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".issue-item");
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    const issue = findIssueById(id);
    if (issue) openIssueModal(issue);
  });

  // 5) Fechar modal: X e botão
  document.getElementById("issueModalClose")?.addEventListener("click", closeIssueModal);
  document.getElementById("issueModalClose2")?.addEventListener("click", closeIssueModal);

  // 6) Fechar ao clicar fora do cartão
  document.getElementById("issueModalBackdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "issueModalBackdrop") closeIssueModal();
  });

  document.getElementById("issueModalSave")?.addEventListener("click", saveIssueEdits);
  document.getElementById("issueModalEdit")?.addEventListener("click", enterEditMode);
  document.getElementById("issueModalCancelEdit")?.addEventListener("click", cancelEditMode);

  // 7) Fechar com Esc
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeIssueModal();
  });
});