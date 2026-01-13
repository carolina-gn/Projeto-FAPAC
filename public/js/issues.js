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