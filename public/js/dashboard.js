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
  chartVariaveisTempo: document.querySelector("#dashboardPanelAmbiente canvas#chartAmbienteVariaveisTempo"),
  chartCo2Tempo: document.querySelector("#dashboardPanelAmbiente canvas#chartAmbienteCo2Tempo"),
  chartHvacTemperatura: document.querySelector("#dashboardPanelAmbiente canvas#chartAmbienteHvacTemperatura"),
  chartOcupacaoHvac: document.querySelector("#dashboardPanelAmbiente canvas#chartAmbienteOcupacaoHvac"),
  chartScatter: document.querySelector("#dashboardPanelAmbiente canvas#chartAmbienteScatter")
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
  let ambienteVariaveisChart = null;
  let ambienteCo2Chart = null;
  let ambienteHvacTemperaturaChart = null;
  let ambienteOcupacaoHvacChart = null;
  let ambienteScatterChart = null;
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

    setText(vibracaoElements.vibracaoMedia, formatNumber(result.cards.vibracaoMedia));
    setText(vibracaoElements.equipamentos, result.cards.equipamentos);
    setText(vibracaoElements.alertas, result.cards.alertas);

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
    console.error(err);
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

  function renderAmbienteVariaveisChart(chartData) {
    if (!ambienteElements.chartVariaveisTempo || !chartData) return;

    const ctx = ambienteElements.chartVariaveisTempo.getContext("2d");

    if (ambienteVariaveisChart) {
      ambienteVariaveisChart.destroy();
    }

    ambienteVariaveisChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: chartData.labels || [],
        datasets: [
          {
            label: "Temperatura (°C)",
            data: chartData.temperatura || [],
            yAxisID: "y"
          },
          {
            label: "CO₂ (ppm)",
            data: chartData.co2 || [],
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
            beginAtZero: false
          },
          y1: {
            type: "linear",
            position: "right",
            beginAtZero: false,
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  }

  function renderAmbienteCo2Chart(chartData) {
    if (!ambienteElements.chartCo2Tempo || !chartData) return;

    const ctx = ambienteElements.chartCo2Tempo.getContext("2d");

    if (ambienteCo2Chart) {
        ambienteCo2Chart.destroy();
    }

    ambienteCo2Chart = new Chart(ctx, {
        type: "line",
        data: {
        labels: chartData.labels || [],
        datasets: [
            {
            label: "CO₂ (ppm)",
            data: chartData.values || []
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
            beginAtZero: false
            }
        }
        }
    });
    }

    function renderAmbienteHvacTemperaturaChart(chartData) {
        if (!ambienteElements.chartHvacTemperatura || !chartData) return;

        const ctx = ambienteElements.chartHvacTemperatura.getContext("2d");

        if (ambienteHvacTemperaturaChart) {
            ambienteHvacTemperaturaChart.destroy();
        }

        ambienteHvacTemperaturaChart = new Chart(ctx, {
            type: "bar",
            data: {
            labels: chartData.labels || [],
            datasets: [
                {
                label: "Temperatura média (°C)",
                data: chartData.values || []
                }
            ]
            },
            options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                beginAtZero: false
                }
            }
            }
        });
        }

        function renderAmbienteOcupacaoHvacChart(chartData) {
            console.log("renderAmbienteOcupacaoHvacChart -> element:", ambienteElements.chartOcupacaoHvac);
            console.log("renderAmbienteOcupacaoHvacChart -> data:", chartData);

            if (!ambienteElements.chartOcupacaoHvac || !chartData) {
                console.warn("Gráfico Ocupação vs HVAC não pôde ser renderizado.");
                return;
            }

            if (!(ambienteElements.chartOcupacaoHvac instanceof HTMLCanvasElement)) {
                console.error("chartOcupacaoHvac não é um canvas:", ambienteElements.chartOcupacaoHvac);
                return;
            }

            const ctx = ambienteElements.chartOcupacaoHvac.getContext("2d");

            if (!ctx) {
                console.error("Não foi possível obter o contexto 2D do canvas.");
                return;
            }

            if (ambienteOcupacaoHvacChart) {
                ambienteOcupacaoHvacChart.destroy();
            }

            ambienteOcupacaoHvacChart = new Chart(ctx, {
                type: "bar",
                data: {
                labels: chartData.labels || [],
                datasets: [
                    {
                    label: "HVAC ligado (%)",
                    data: chartData.values || [],
                    backgroundColor: ["rgba(99, 102, 241, 0.65)", "rgba(139, 92, 246, 0.65)"],
                    borderColor: ["rgba(99, 102, 241, 1)", "rgba(139, 92, 246, 1)"],
                    borderWidth: 1
                    }
                ]
                },
                options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: {
                    display: true
                    }
                },
                scales: {
                    y: {
                    beginAtZero: true,
                    max: 100
                    }
                }
                }
            });

            console.log("Gráfico Ocupação vs HVAC criado:", ambienteOcupacaoHvacChart);
            }

    function renderAmbienteScatterChart(chartData) {
        if (!ambienteElements.chartScatter || !chartData) return;

        if (!(ambienteElements.chartScatter instanceof HTMLCanvasElement)) {
            console.error("chartScatter não é um canvas:", ambienteElements.chartScatter);
            return;
        }

        const ctx = ambienteElements.chartScatter.getContext("2d");

        if (!ctx) {
            console.error("Não foi possível obter o contexto 2D do scatter.");
            return;
        }

        if (ambienteScatterChart) {
            ambienteScatterChart.destroy();
        }

        ambienteScatterChart = new Chart(ctx, {
            type: "scatter",
            data: {
            datasets: [
                {
                label: "Temperatura vs CO₂",
                data: chartData || [],
                backgroundColor: "rgba(99, 102, 241, 0.65)",
                borderColor: "rgba(99, 102, 241, 1)"
                }
            ]
            },
            options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: {
                type: "linear",
                title: {
                    display: true,
                    text: "Temperatura (°C)"
                }
                },
                y: {
                title: {
                    display: true,
                    text: "CO₂ (ppm)"
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

      renderAmbienteVariaveisChart(charts.variaveisTempo);
      renderAmbienteCo2Chart(charts.co2Tempo);
      renderAmbienteHvacTemperaturaChart(charts.hvacImpactoTemperatura);
      renderAmbienteOcupacaoHvacChart(charts.ocupacaoVsHvac);
      renderAmbienteScatterChart(charts.scatterTempCo2);
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

  setActiveTab("ambiente");
    loadAmbienteCards();
    loadConsumoCards();
    loadFugaCards();
    loadVibracaoCards();
})();