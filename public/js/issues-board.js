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
    const res = await fetch("/api/issues");
    const data = await res.json();

    if (!res.ok) {
      console.error(data);
      alert("Erro a carregar issues: " + (data.message || "desconhecido"));
      return;
    }

    // guarda em memória para filtrar sem refetch
    window.__ALL_ISSUES__ = data;

    const filtered = applyBuildingFilter(data);
    renderBoard(filtered);
  } catch (err) {
    console.error(err);
    alert("Não foi possível ligar ao backend para carregar issues.");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  // carregar tudo
  loadBoard();

  // filtro edifício (já tens UI; funciona já)
  document.getElementById("buildingFilter")?.addEventListener("change", () => {
    const all = window.__ALL_ISSUES__ || [];
    renderBoard(applyBuildingFilter(all));
  });

  document.getElementById("clearBuildingFilter")?.addEventListener("click", () => {
    const filterEl = document.getElementById("buildingFilter");
    if (filterEl) filterEl.value = "all";
    const all = window.__ALL_ISSUES__ || [];
    renderBoard(all);
  });
});