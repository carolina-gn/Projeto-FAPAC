(function () {
  const dashboardPage = document.getElementById("dashboardPage");
  const tabButtons = Array.from(document.querySelectorAll(".dashboard-tab-btn"));
  const panels = {
    ambiente: document.getElementById("dashboardPanelAmbiente"),
    consumo: document.getElementById("dashboardPanelConsumo"),
    fuga: document.getElementById("dashboardPanelFuga"),
    vibracao: document.getElementById("dashboardPanelVibracao")
  };

  const ambienteElements = {
  temperaturaMedia: document.getElementById("ambienteTemperaturaMedia"),
  co2Medio: document.getElementById("ambienteCo2Medio"),
  taxaOcupacao: document.getElementById("ambienteTaxaOcupacao"),
  hvacLigado: document.getElementById("ambienteHvacLigado"),
  conforto: document.getElementById("ambienteConforto"),
  chartTempHumidade: document.querySelector("#dashboardPanelAmbiente canvas#chartAmbienteTempHumidade"),
  chartTempOcupacao: document.querySelector("#dashboardPanelAmbiente canvas#chartAmbienteTempOcupacao"),
  chartCo2Ocupacao: document.querySelector("#dashboardPanelAmbiente canvas#chartAmbienteCo2Ocupacao"),
  chartHvacTemperaturaTempo: document.querySelector("#dashboardPanelAmbiente canvas#chartAmbienteHvacTemperaturaTempo")
};

const consumoElements = {
  consumoMedio: document.getElementById("consumoMedio"),
  potenciaMedia: document.getElementById("potenciaMedia"),
  circuitoPrincipal: document.getElementById("circuitoPrincipal"),

  chartConsumoTempo: document.getElementById("chartConsumoTempo"),
  chartPotenciaTempo: document.getElementById("chartPotenciaTempo"),
  chartConsumoCircuito: document.getElementById("chartConsumoCircuito")
};

const fugaElements = {
  humidadeMedia: document.getElementById("fugaHumidadeMedia"),
  locaisMonitorizados: document.getElementById("fugaLocaisMonitorizados"),
  fugaDetetadas: document.getElementById("fugaDetetadas"),
  chartHumidadeTempo: document.getElementById("chartFugaHumidadeTempo"),
  chartHumidadeLocal: document.getElementById("chartFugaHumidadeLocal"),
  chartEstadoLocal: document.getElementById("chartFugaEstadoLocal")
};

const vibracaoElements = {
  vibracaoMedia: document.getElementById("vibracaoMedia"),
  equipamentos: document.getElementById("vibracaoEquipamentos"),
  alertas: document.getElementById("vibracaoAlertas"),
  chartTempo: document.getElementById("chartVibracaoTempo"),
  chartEquipamento: document.getElementById("chartVibracaoEquipamento"),
  chartEstado: document.getElementById("chartVibracaoEstado")
};

    let consumoTempoChart = null;
    let potenciaTempoChart = null;
    let consumoCircuitoChart = null;
    let ambienteTempHumidadeChart = null;
    let ambienteTempOcupacaoChart = null;
    let ambienteCo2OcupacaoChart = null;
    let ambienteHvacTemperaturaTempoChart = null;
    let fugaHumidadeChart = null;
    let fugaLocalChart = null;
    let fugaEstadoChart = null;

    let vibracaoTempoChart = null;
    let vibracaoEquipamentoChart = null;
    let vibracaoEstadoChart = null;

  if (!dashboardPage || tabButtons.length === 0) {
    console.warn("Dashboard elements not found.");
    return;
  }

  function renderConsumoChart(el, chartRef, type, label, labels, values) {
    if (!el) return;

    if (!(el instanceof HTMLCanvasElement)) {
        el.innerHTML = `<canvas></canvas>`;
        el = el.querySelector("canvas");
    }

    const ctx = el.getContext("2d");

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(ctx, {
        type,
        data: {
            labels,
            datasets: [{
                label,
                data: values,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    }

    async function loadConsumoCards() {
        try {
            const response = await fetch("/api/sensors/dashboard/consumo");
            const result = await response.json();

            if (!result.ok) throw new Error(result.error);

            setText(consumoElements.consumoMedio, `${formatNumber(result.cards.consumoMedio)} kWh`);
            setText(consumoElements.potenciaMedia, `${formatNumber(result.cards.potenciaMedia)} kW`);
            setText(consumoElements.circuitoPrincipal, result.cards.circuitoPrincipal);

            renderConsumoChart(
                consumoElements.chartConsumoTempo,
                { current: consumoTempoChart },
                "line",
                "Consumo",
                result.charts.consumoTempo.labels,
                result.charts.consumoTempo.values
            );

            renderConsumoChart(
                consumoElements.chartPotenciaTempo,
                { current: potenciaTempoChart },
                "line",
                "Potência",
                result.charts.potenciaTempo.labels,
                result.charts.potenciaTempo.values
            );

            renderConsumoChart(
                consumoElements.chartConsumoCircuito,
                { current: consumoCircuitoChart },
                "bar",
                "Consumo Médio",
                result.charts.consumoCircuito.labels,
                result.charts.consumoCircuito.values
            );

        } catch (err) {
            console.error("Erro Consumo:", err);
        }
    }

function renderSimpleChart(canvas, chartRef, type, label, labels, values) {
  if (!canvas) return null;

  if (!(canvas instanceof HTMLCanvasElement)) {
    canvas.innerHTML = "<canvas></canvas>";
    canvas = canvas.querySelector("canvas");
  }

  const ctx = canvas.getContext("2d");

  if (chartRef) chartRef.destroy();

  return new Chart(ctx, {
    type,
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}   

async function loadFugaCards() {
  try {
    const response = await fetch("/api/sensors/dashboard/fuga");
    const result = await response.json();

    setText(fugaElements.humidadeMedia, `${formatNumber(result.cards.humidadeMedia)} %`);
    setText(fugaElements.locaisMonitorizados, result.cards.locaisMonitorizados);
    setText(fugaElements.fugaDetetadas, result.cards.fugasDetetadas);

    fugaHumidadeChart = renderSimpleChart(
      fugaElements.chartHumidadeTempo,
      fugaHumidadeChart,
      "line",
      "Humidade",
      result.charts.humidadeTempo.labels,
      result.charts.humidadeTempo.values
    );

    fugaLocalChart = renderSimpleChart(
      fugaElements.chartHumidadeLocal,
      fugaLocalChart,
      "bar",
      "Humidade Média",
      result.charts.humidadeLocal.labels,
      result.charts.humidadeLocal.values
    );

    fugaEstadoChart = renderSimpleChart(
      fugaElements.chartEstadoLocal,
      fugaEstadoChart,
      "bar",
      "Alertas",
      result.charts.estadoLocal.labels,
      result.charts.estadoLocal.values
    );

  } catch (err) {
    console.error(err);
  }
}

async function loadVibracaoCards() {
  try {
    const response = await fetch("/api/sensors/dashboard/vibracao");
    const result = await response.json();
    const cards = result.cards || {};
    const charts = result.charts || {};

    setText(vibracaoElements.vibracaoMedia, `${formatNumber(cards.vibracaoMedia)} mm/s`);
    setText(vibracaoElements.equipamentos, cards.equipamentos ?? "--");
    setText(vibracaoElements.alertas, cards.alertas ?? "--");

    vibracaoTempoChart = renderSimpleChart(
      vibracaoElements.chartTempo,
      vibracaoTempoChart,
      "line",
      "Vibração",
      result.charts.vibracaoTempo.labels,
      result.charts.vibracaoTempo.values
    );

    vibracaoEquipamentoChart = renderSimpleChart(
      vibracaoElements.chartEquipamento,
      vibracaoEquipamentoChart,
      "bar",
      "Média",
      result.charts.vibracaoEquipamento.labels,
      result.charts.vibracaoEquipamento.values
    );

    vibracaoEstadoChart = renderSimpleChart(
      vibracaoElements.chartEstado,
      vibracaoEstadoChart,
      "bar",
      "Alertas",
      result.charts.estado.labels,
      result.charts.estado.values
    );

  } catch (err) {
    console.error("Erro Vibração:", err);
  }
}

  function setActiveTab(tabName) {
    tabButtons.forEach((button) => {
      const isActive = button.dataset.dashboardTab === tabName;
      button.classList.toggle("active", isActive);
      button.classList.toggle("btn-secondary", !isActive);
    });

    Object.entries(panels).forEach(([name, panel]) => {
      if (!panel) return;
      panel.hidden = name !== tabName;
    });
  }

  function formatNumber(value, digits = 2) {
    const num = Number(value ?? 0);
    return Number.isFinite(num) ? num.toFixed(digits) : "--";
  }

  function setText(element, value) {
    if (!element) return;
    element.textContent = value;
  }

  function renderDualLineChart(canvas, chartRef, chartData, labelA, fieldA, axisA, labelB, fieldB, axisB) {
  if (!canvas || !chartData) return chartRef;

  const ctx = canvas.getContext("2d");

  if (chartRef) {
    chartRef.destroy();
  }

  return new Chart(ctx, {
    type: "line",
    data: {
      labels: chartData.labels || [],
      datasets: [
        {
          label: labelA,
          data: chartData[fieldA] || [],
          yAxisID: "y"
        },
        {
          label: labelB,
          data: chartData[fieldB] || [],
          yAxisID: "y1"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      scales: {
        y: {
          type: "linear",
          position: "left",
          title: {
            display: true,
            text: axisA
          }
        },
        y1: {
          type: "linear",
          position: "right",
          title: {
            display: true,
            text: axisB
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });
}

function renderAmbienteHvacTemperaturaTempoChart(chartData) {
  if (!ambienteElements.chartHvacTemperaturaTempo || !chartData) return;

  const ctx = ambienteElements.chartHvacTemperaturaTempo.getContext("2d");

  if (ambienteHvacTemperaturaTempoChart) {
    ambienteHvacTemperaturaTempoChart.destroy();
  }

  ambienteHvacTemperaturaTempoChart = new Chart(ctx, {
    data: {
      labels: chartData.labels || [],
      datasets: [
        {
          type: "bar",
          label: "HVAC ligado",
          data: chartData.hvac || [],
          yAxisID: "y1",
          order: 2,
          barPercentage: 1,
          categoryPercentage: 1,
          backgroundColor: "rgba(59, 130, 246, 0.18)",
          borderWidth: 0
        },
        {
          type: "line",
          label: "Temperatura (°C)",
          data: chartData.temperatura || [],
          yAxisID: "y",
          order: 1,
          tension: 0.25
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      scales: {
        y: {
          position: "left",
          title: {
            display: true,
            text: "Temperatura (°C)"
          }
        },
        y1: {
          position: "right",
          min: 0,
          max: 1,
          display: false,
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });
}

  async function loadAmbienteCards() {
    try {
      const response = await fetch("/api/sensors/dashboard/ambiente");
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Erro ao carregar dados de ambiente.");
      }

      const cards = result.cards || {};
      const charts = result.charts || {};

      setText(ambienteElements.temperaturaMedia, `${formatNumber(cards.temperaturaMedia)} °C`);
      setText(ambienteElements.co2Medio, `${formatNumber(cards.co2Medio)} ppm`);
      setText(ambienteElements.taxaOcupacao, `${formatNumber(cards.taxaOcupacao)} %`);
      setText(ambienteElements.hvacLigado, `${formatNumber(cards.hvacLigadoPercent)} %`);
      setText(ambienteElements.conforto, cards.conforto || "--");

      ambienteTempHumidadeChart = renderDualLineChart(
        ambienteElements.chartTempHumidade,
        ambienteTempHumidadeChart,
        charts.tempHumidade,
        "Temperatura (°C)",
        "temperatura",
        "Temperatura (°C)",
        "Humidade (%)",
        "humidade",
        "Humidade (%)"
      );

      ambienteTempOcupacaoChart = renderDualLineChart(
        ambienteElements.chartTempOcupacao,
        ambienteTempOcupacaoChart,
        charts.tempOcupacao,
        "Temperatura (°C)",
        "temperatura",
        "Temperatura (°C)",
        "Ocupação",
        "ocupacao",
        "Ocupação"
      );

      ambienteCo2OcupacaoChart = renderDualLineChart(
        ambienteElements.chartCo2Ocupacao,
        ambienteCo2OcupacaoChart,
        charts.co2Ocupacao,
        "CO₂ (ppm)",
        "co2",
        "CO₂ (ppm)",
        "Ocupação",
        "ocupacao",
        "Ocupação"
      );

      renderAmbienteHvacTemperaturaTempoChart(charts.hvacTemperaturaTempo);
    } catch (error) {
      console.error("Erro ao carregar KPIs de ambiente:", error);

      setText(ambienteElements.temperaturaMedia, "Erro");
      setText(ambienteElements.co2Medio, "Erro");
      setText(ambienteElements.taxaOcupacao, "Erro");
      setText(ambienteElements.hvacLigado, "Erro");
      setText(ambienteElements.conforto, "Erro");
    }
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.dataset.dashboardTab;
      setActiveTab(tabName);
    });
  });

  window.showDashboardTab = function (tabName) {
    if (!panels[tabName]) {
      console.warn(`Dashboard tab "${tabName}" does not exist.`);
      return;
    }
    setActiveTab(tabName);
  };

    function refreshDashboardData() {
    loadAmbienteCards();
    loadConsumoCards();
    loadFugaCards();
    loadVibracaoCards();
  }

  setActiveTab("ambiente");
  refreshDashboardData();

  setInterval(refreshDashboardData, 300000); // 5 minutos
})();
