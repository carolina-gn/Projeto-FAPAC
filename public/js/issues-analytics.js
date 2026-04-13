(() => {
  let statusChart = null;
  let priorityChart = null;
  let typeChart = null;
  let buildingChart = null;
  let trendChart = null;

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function countBy(items, getKey) {
    const map = new Map();
    for (const item of items) {
      const key = getKey(item) || "Sem dados";
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }

  function mapToChartData(map) {
    return {
      labels: Array.from(map.keys()),
      values: Array.from(map.values())
    };
  }

  function destroyChart(chart) {
    if (chart) chart.destroy();
  }

  function createBarChart(canvasId, labels, data, label) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    return new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label,
          data
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  function createLineChart(canvasId, labels, data, label) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    return new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label,
          data,
          tension: 0.25,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  function createDoughnutChart(canvasId, labels, data, label) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    return new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          label,
          data
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            position: "bottom"
          }
        }
      }
    });
  }

  function formatDays(avgMs) {
    if (!avgMs || avgMs <= 0) return "—";
    const days = avgMs / (1000 * 60 * 60 * 24);
    return `${days.toFixed(1)} dias`;
  }

  function monthKey(dateValue) {
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return null;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  function monthLabel(key) {
    const [year, month] = key.split("-");
    return `${month}/${year}`;
  }

  function getLast12MonthsKeys() {
    const keys = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      keys.push(`${y}-${m}`);
    }

    return keys;
  }

  function computeAnalytics(issues) {
    const total = issues.length;
    const open = issues.filter(i => i.status === "aberta").length;
    const progress = issues.filter(i => i.status === "em_progresso").length;
    const resolved = issues.filter(i => i.status === "resolvida").length;
    const closed = issues.filter(i => i.status === "fechada").length;

    const now = Date.now();
    const last30DaysMs = 30 * 24 * 60 * 60 * 1000;
    const created30 = issues.filter(i => {
      const createdAt = new Date(i.createdAt).getTime();
      return !Number.isNaN(createdAt) && (now - createdAt <= last30DaysMs);
    }).length;

    const finished = issues.filter(i => i.status === "resolvida" || i.status === "fechada");
    const resolutionRate = total ? (((resolved + closed) / total) * 100).toFixed(1) : "0.0";

    const avgResolutionMs = finished.length
      ? finished.reduce((acc, issue) => {
          const createdAt = new Date(issue.createdAt).getTime();
          const updatedAt = new Date(issue.updatedAt).getTime();
          if (Number.isNaN(createdAt) || Number.isNaN(updatedAt) || updatedAt < createdAt) {
            return acc;
          }
          return acc + (updatedAt - createdAt);
        }, 0) / finished.length
      : 0;

    const byStatus = mapToChartData(countBy(issues, i => {
      return {
        aberta: "Abertas",
        em_progresso: "Em Progresso",
        resolvida: "Resolvidas",
        fechada: "Fechadas"
      }[i.status] || i.status;
    }));

    const byPriority = mapToChartData(countBy(issues, i => {
      return {
        baixa: "Baixa",
        media: "Média",
        alta: "Alta",
        critica: "Crítica"
      }[i.priority] || i.priority;
    }));

    const byType = mapToChartData(countBy(issues, i => {
      return {
        avaria: "Avaria",
        pedido: "Pedido",
        inspecao: "Inspeção"
      }[i.type] || i.type;
    }));

    const byBuilding = mapToChartData(countBy(issues, i => i?.location?.building || "Sem edifício"));

    const trendKeys = getLast12MonthsKeys();
    const createdByMonthMap = new Map(trendKeys.map(k => [k, 0]));

    issues.forEach(issue => {
      const key = monthKey(issue.createdAt);
      if (key && createdByMonthMap.has(key)) {
        createdByMonthMap.set(key, createdByMonthMap.get(key) + 1);
      }
    });

    return {
      total,
      open,
      progress,
      resolved,
      closed,
      created30,
      resolutionRate: `${resolutionRate}%`,
      avgResolution: formatDays(avgResolutionMs),
      byStatus,
      byPriority,
      byType,
      byBuilding,
      trendLabels: trendKeys.map(monthLabel),
      trendValues: trendKeys.map(k => createdByMonthMap.get(k) || 0)
    };
  }

  async function fetchIssuesForAnalytics() {
    const res = await fetch("/api/projects/issues");
    if (!res.ok) {
      throw new Error("Erro ao carregar issues para análise.");
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async function loadIssuesAnalytics() {
    try {
      const issues = await fetchIssuesForAnalytics();
      const analytics = computeAnalytics(issues);

      setText("issuesAnalyticsTotal", String(analytics.total));
      setText("issuesAnalyticsOpen", String(analytics.open));
      setText("issuesAnalyticsProgress", String(analytics.progress));
      setText("issuesAnalyticsResolved", String(analytics.resolved));
      setText("issuesAnalyticsClosed", String(analytics.closed));
      setText("issuesAnalyticsCreated30", String(analytics.created30));
      setText("issuesAnalyticsResolutionRate", analytics.resolutionRate);
      setText("issuesAnalyticsAvgResolution", analytics.avgResolution);

      destroyChart(statusChart);
      destroyChart(priorityChart);
      destroyChart(typeChart);
      destroyChart(buildingChart);
      destroyChart(trendChart);

      statusChart = createDoughnutChart(
        "issuesStatusChart",
        analytics.byStatus.labels,
        analytics.byStatus.values,
        "Issues por Estado"
      );

      priorityChart = createBarChart(
        "issuesPriorityChart",
        analytics.byPriority.labels,
        analytics.byPriority.values,
        "Issues por Prioridade"
      );

      typeChart = createBarChart(
        "issuesTypeChart",
        analytics.byType.labels,
        analytics.byType.values,
        "Issues por Tipo"
      );

      buildingChart = createBarChart(
        "issuesBuildingChart",
        analytics.byBuilding.labels,
        analytics.byBuilding.values,
        "Issues por Edifício"
      );

      trendChart = createLineChart(
        "issuesCreatedTrendChart",
        analytics.trendLabels,
        analytics.trendValues,
        "Issues Criadas"
      );

      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 100);

    } catch (error) {
      console.error("Erro ao carregar análise de issues:", error);

      setText("issuesAnalyticsTotal", "Erro");
      setText("issuesAnalyticsOpen", "Erro");
      setText("issuesAnalyticsProgress", "Erro");
      setText("issuesAnalyticsResolved", "Erro");
      setText("issuesAnalyticsClosed", "Erro");
      setText("issuesAnalyticsCreated30", "Erro");
      setText("issuesAnalyticsResolutionRate", "Erro");
      setText("issuesAnalyticsAvgResolution", "Erro");
    }
  }

  window.loadIssuesAnalytics = loadIssuesAnalytics;
})();