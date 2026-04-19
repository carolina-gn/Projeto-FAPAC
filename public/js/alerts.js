async function requestBrowserNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("Este browser não suporta notificações.");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    console.warn("Permissão de notificações foi negada.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("Erro ao pedir permissão para notificações:", error);
    return false;
  }
}

async function showBrowserNotification(alert) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const title = alert.title || "Novo alerta";
  const body = alert.message || "Foi detetado um novo alerta.";

  try {
    if (alertsServiceWorkerRegistration) {
      await alertsServiceWorkerRegistration.showNotification(title, {
        body,
        icon: "/images/logo.png",
        badge: "/images/logo.png",
        tag: `alert-${alert._id}`,
        data: {
          alertId: alert._id
        }
      });
      return;
    }

    const notification = new Notification(title, {
      body,
      icon: "/images/logo.png",
      tag: `alert-${alert._id}`
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error("Erro ao mostrar notificação:", error);
  }
}

async function registerAlertsServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker não suportado neste browser.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/service-worker.js");
    alertsServiceWorkerRegistration = registration;
    console.log("Service Worker registado com sucesso.");
    return registration;
  } catch (error) {
    console.error("Erro ao registar Service Worker:", error);
    return null;
  }
}

let ALL_ALERTS = [];
let KNOWN_ALERT_IDS = new Set();
let alertsServiceWorkerRegistration = null;

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
  const meta = `${alert.sala || "—"} · ${alertSeverityLabel(alert.severity)} · ${formatDateTime(alert.lastDetectedAt)}`;

  const actionHtml =
    alert.status === "ativo"
      ? `<button class="btn resolve-alert-btn" type="button" data-id="${alert._id}">Resolver</button>`
      : `<span class="issue-badge">Resolvido</span>`;

  return `
    <div class="issue-item" data-id="${alert._id}">
      <span class="issue-dot ${alert.status === "resolvido" ? "issue-dot--resolved" : "issue-dot--open"}"></span>

      <div class="issue-main">
        <div class="issue-title">${escapeHtml(alert.title)}</div>
        <div class="issue-meta">${escapeHtml(meta)}</div>
        <div class="issue-meta">${escapeHtml(alert.message || "")}</div>
      </div>

      ${actionHtml}
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

    renderAlertsCharts(alerts);
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
          showBrowserNotification(alert);
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

let alertsSeverityChart = null;
let alertsTrendChart = null;

function destroyAlertsCharts() {
  if (alertsSeverityChart) alertsSeverityChart.destroy();
  if (alertsTrendChart) alertsTrendChart.destroy();
}

function renderAlertsCharts(alerts) {
  destroyAlertsCharts();

  const severityMap = {
    baixa: 0,
    media: 0,
    alta: 0,
    critica: 0
  };

  alerts.forEach(alert => {
    const key = String(alert.severity || "").toLowerCase();
    if (severityMap[key] !== undefined) {
      severityMap[key]++;
    }
  });

  const chartText = "#4b5563";
  const chartGrid = "rgba(99, 102, 241, 0.10)";
  const chartBorder = "rgba(99, 102, 241, 0.18)";

  const severityCanvas = document.getElementById("alertsSeverityChart");
  if (severityCanvas) {
    alertsSeverityChart = new Chart(severityCanvas.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: ["Baixa", "Média", "Alta", "Crítica"],
        datasets: [{
          data: [
            severityMap.baixa,
            severityMap.media,
            severityMap.alta,
            severityMap.critica
          ],
          backgroundColor: [
            "#93c5fd",  // azul suave
            "#c4b5fd",  // lilás
            "#f59e0b",  // âmbar
            "#f87171"   // vermelho suave
          ],
          borderColor: "rgba(255,255,255,0.65)",
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "52%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: chartText,
              padding: 14,
              boxWidth: 14,
              usePointStyle: true,
              pointStyle: "circle"
            }
          }
        }
      }
    });
  }

  const trendMap = new Map();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    trendMap.set(d.toISOString().slice(0, 10), 0);
  }

  alerts.forEach(alert => {
    if (!alert.createdAt) return;
    const key = new Date(alert.createdAt).toISOString().slice(0, 10);
    if (trendMap.has(key)) {
      trendMap.set(key, trendMap.get(key) + 1);
    }
  });

  const trendCanvas = document.getElementById("alertsTrendChart");
  if (trendCanvas) {
    alertsTrendChart = new Chart(trendCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels: Array.from(trendMap.keys()).map(v => v.slice(5)),
        datasets: [{
          label: "Alertas",
          data: Array.from(trendMap.values()),
          tension: 0.35,
          fill: true,
          borderColor: "#7c3aed",
          backgroundColor: "rgba(124, 58, 237, 0.12)",
          pointBackgroundColor: "#8b5cf6",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 5,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              color: chartGrid
            },
            ticks: {
              color: chartText
            },
            border: {
              color: chartBorder
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              color: chartText
            },
            grid: {
              color: chartGrid
            },
            border: {
              color: chartBorder
            }
          }
        }
      }
    });
  }
}

window.addEventListener("load", async () => {
  await requestBrowserNotificationPermission();
  loadAlerts(false);
  setInterval(() => loadAlerts(true), 30000);
});