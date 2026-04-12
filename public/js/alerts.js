let ALL_ALERTS = [];
let KNOWN_ALERT_IDS = new Set();

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("pt-PT");
}

function alertSeverityLabel(severity) {
  return {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
    critica: "Crítica"
  }[severity] || severity || "—";
}

function buildAlertButtonHtml(alert) {
  const statusText = alert.status === "resolvido" ? "Resolvido" : "Ativo";
  const meta = `${alert.sala || "—"} · ${alertSeverityLabel(alert.severity)} · ${formatDateTime(alert.lastDetectedAt)}`;

  return `
    <div class="issue-item" data-id="${alert._id}">
      <span class="issue-dot ${alert.status === "resolvido" ? "issue-dot--resolved" : "issue-dot--open"}"></span>
      <div class="issue-main">
        <div class="issue-title">${escapeHtml(alert.title)}</div>
        <div class="issue-meta">${escapeHtml(meta)}</div>
        <div class="issue-meta">${escapeHtml(alert.message || "")}</div>
      </div>
      ${
        alert.status === "ativo"
          ? `<button class="btn btn-secondary resolve-alert-btn" type="button" data-id="${alert._id}">Resolver</button>`
          : `<span class="issue-badge">${statusText}</span>`
      }
    </div>
  `;
}

function renderAlerts(alerts) {
  const activeList = document.getElementById("listAlertsActive");
  const resolvedList = document.getElementById("listAlertsResolved");

  if (!activeList || !resolvedList) return;

  const active = alerts.filter(a => a.status === "ativo");
  const resolved = alerts.filter(a => a.status === "resolvido");

  activeList.innerHTML = active.length
    ? active.map(buildAlertButtonHtml).join("")
    : `<div style="padding:10px; opacity:.6;">Sem alertas ativos</div>`;

  resolvedList.innerHTML = resolved.length
    ? resolved.map(buildAlertButtonHtml).join("")
    : `<div style="padding:10px; opacity:.6;">Sem alertas resolvidos</div>`;

  const countActive = document.getElementById("countAlertsActive");
  const countResolved = document.getElementById("countAlertsResolved");
  const badge = document.getElementById("alertsActiveBadge");

  if (countActive) countActive.textContent = String(active.length);
  if (countResolved) countResolved.textContent = String(resolved.length);
  if (badge) badge.textContent = String(active.length);
}

function applyAlertsFilter() {
  const filter = document.getElementById("alertsStatusFilter")?.value || "all";

  if (filter === "all") {
    renderAlerts(ALL_ALERTS);
    return;
  }

  renderAlerts(ALL_ALERTS.filter(a => a.status === filter));
}

async function loadAlerts(showToasts = false) {
  try {
    const res = await fetch("/api/alerts");
    if (!res.ok) throw new Error("Erro ao carregar alertas");

    const alerts = await res.json();
    ALL_ALERTS = Array.isArray(alerts) ? alerts : [];

    if (showToasts) {
      const activeAlerts = ALL_ALERTS.filter(a => a.status === "ativo");
      for (const alert of activeAlerts) {
        if (!KNOWN_ALERT_IDS.has(String(alert._id))) {
          showAlertToast(alert);
        }
      }
    }

    KNOWN_ALERT_IDS = new Set(ALL_ALERTS.map(a => String(a._id)));
    applyAlertsFilter();
  } catch (err) {
    console.error(err);
  }
}

async function resolveAlert(alertId) {
  try {
    const res = await fetch(`/api/alerts/${alertId}/resolve`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });

    if (!res.ok) throw new Error("Erro ao resolver alerta");
    await loadAlerts(false);
  } catch (err) {
    console.error(err);
    alert("Não foi possível resolver o alerta.");
  }
}

function ensureToastContainer() {
  let container = document.getElementById("alertsToastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "alertsToastContainer";
    container.className = "alerts-toast-container";
    document.body.appendChild(container);
  }
  return container;
}

function showAlertToast(alert) {
  const container = ensureToastContainer();

  const toast = document.createElement("div");
  toast.className = "alert-toast";
  toast.innerHTML = `
    <div class="alert-toast-title">Novo alerta</div>
    <div class="alert-toast-message">${escapeHtml(alert.message)}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 6000);
}

document.addEventListener("click", event => {
  const btn = event.target.closest(".resolve-alert-btn");
  if (!btn) return;
  resolveAlert(btn.dataset.id);
});

document.getElementById("alertsStatusFilter")?.addEventListener("change", applyAlertsFilter);

document.getElementById("clearAlertsFilter")?.addEventListener("click", () => {
  const filter = document.getElementById("alertsStatusFilter");
  if (filter) filter.value = "all";
  renderAlerts(ALL_ALERTS);
});

window.addEventListener("load", () => {
  loadAlerts(false);
  setInterval(() => loadAlerts(true), 30000);
});