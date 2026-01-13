document.getElementById('viewAllIssues')
  ?.addEventListener('click', () => {
    window.location.href = '/html/issues.html';
  });

  // Se existir botão para ver todas as issues, mantém
document.getElementById('viewAllIssues')
  ?.addEventListener('click', () => {
    window.location.href = '/html/issues.html';
  });

function normalizeStatus(v) {
  const s = (v || "").toLowerCase().trim();
  if (s === "aberta") return "aberta";
  if (s === "em progresso") return "em_progresso";
  if (s === "resolvida") return "resolvida";
  if (s === "fechada") return "fechada";
  return "";
}

function normalizePriority(v) {
  const s = (v || "").toLowerCase().trim();
  if (s === "baixa") return "baixa";
  if (s === "média" || s === "media") return "media";
  if (s === "alta") return "alta";
  if (s === "crítica" || s === "critica") return "critica";
  return "";
}

function normalizeType(v) {
  const s = (v || "").toLowerCase().trim();
  if (s === "avaria") return "avaria";
  if (s === "pedido") return "pedido";
  if (s === "inspeção" || s === "inspecao") return "inspecao";
  return "";
}

function clearIssueForm() {
  document.getElementById("issueTitle").value = "";
  document.getElementById("issueDesc").value = "";
  document.getElementById("issueStatus").value = "";
  document.getElementById("issuePriority").value = "";
  document.getElementById("issueType").value = "";

  document.getElementById("locBuilding").value = "";
  document.getElementById("locFloor").value = "";
  document.getElementById("locSpace").value = "";

  document.getElementById("modelBuilding").value = "";
  document.getElementById("modelElement").value = "";

  document.getElementById("assignedTo").value = "";
}

document.getElementById("btnCancelIssue")
  ?.addEventListener("click", clearIssueForm);

document.getElementById("btnCreateIssue")
  ?.addEventListener("click", async () => {
    const payload = {
      title: document.getElementById("issueTitle").value.trim(),
      description: document.getElementById("issueDesc").value.trim(),

      status: normalizeStatus(document.getElementById("issueStatus").value),
      priority: normalizePriority(document.getElementById("issuePriority").value),
      type: normalizeType(document.getElementById("issueType").value),

      location: {
        building: document.getElementById("locBuilding").value.trim(),
        floor: document.getElementById("locFloor").value.trim(),
        space: document.getElementById("locSpace").value.trim(),
      },

      modelLink: {
        building: document.getElementById("modelBuilding").value.trim(),
        element: document.getElementById("modelElement").value.trim(),
      },

      assignedToName: document.getElementById("assignedTo").value
    };

    // validação mínima antes de enviar
    if (!payload.title) return alert("Preenche o Título.");
    if (!payload.status) return alert("Seleciona o Estado.");
    if (!payload.priority) return alert("Seleciona a Prioridade.");
    if (!payload.type) return alert("Seleciona o Tipo.");

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        alert("Erro ao criar issue: " + (data.error || data.message || "desconhecido"));
        return;
      }

      alert("Issue criada!");
      clearIssueForm();

    } catch (err) {
      console.error(err);
      alert("Erro de ligação ao servidor (backend).");
    }
  });

  function statusDotClass(status) {
  // status vem do Mongo: aberta | em_progresso | resolvida | fechada
  if (status === "aberta") return "issue-dot--open";
  if (status === "em_progresso") return "issue-dot--progress";
  if (status === "resolvida") return "issue-dot--resolved";
  if (status === "fechada") return "issue-dot--closed"; // se não existir no CSS, usamos fallback abaixo
  return "issue-dot--open";
}

function priorityBadgeClass(priority) {
  if (priority === "critica") return "issue-badge--high";
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

  // escolhe o melhor que tiver preenchido
  const parts = [];
  if (floor) parts.push(floor);
  if (space) parts.push(space);
  else if (building) parts.push(building);

  return parts.join(" · ") || "—";
}

function renderIssues(issues) {
  const listEl = document.getElementById("issuesList") || document.querySelector(".issues-list");
  if (!listEl) return;

  if (!issues || issues.length === 0) {
    listEl.innerHTML = `<div style="padding: 10px; opacity: .7;">Sem issues.</div>`;
    return;
  }

  listEl.innerHTML = issues.map((issue) => {
    const dot = statusDotClass(issue.status);
    const badgeClass = priorityBadgeClass(issue.priority);
    const meta = buildIssueMeta(issue);
    const badgeText = priorityLabel(issue.priority);

    // guarda o id no data-id para mais tarde (abrir detalhes, etc)
    return `
      <button class="issue-item" type="button" data-id="${issue._id}">
        <span class="issue-dot ${dot}"></span>
        <div class="issue-main">
          <div class="issue-title">${escapeHtml(issue.title || "")}</div>
          <div class="issue-meta">${escapeHtml(meta)}</div>
        </div>
        <span class="issue-badge ${badgeClass}">${escapeHtml(badgeText)}</span>
      </button>
    `;
  }).join("");
}

// pequena proteção para não partir HTML com caracteres especiais
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadIssues() {
  try {
    const res = await fetch("/api/issues");
    const data = await res.json();

    if (!res.ok) {
      console.error(data);
      alert("Erro a carregar issues: " + (data.message || "desconhecido"));
      return;
    }

    renderIssues(data);
  } catch (err) {
    console.error(err);
    alert("Não foi possível ligar ao backend para carregar issues.");
  }
}

// carrega assim que a página abre
window.addEventListener("DOMContentLoaded", loadIssues);