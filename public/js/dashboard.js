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
    conforto: document.getElementById("ambienteConforto")
  };

  if (!dashboardPage || tabButtons.length === 0) {
    console.warn("Dashboard elements not found.");
    return;
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

  async function loadAmbienteCards() {
    try {
      const response = await fetch("/api/sensors/dashboard/ambiente");
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Erro ao carregar dados de ambiente.");
      }

      const cards = result.cards || {};

      setText(ambienteElements.temperaturaMedia, `${formatNumber(cards.temperaturaMedia)} °C`);
      setText(ambienteElements.co2Medio, `${formatNumber(cards.co2Medio)} ppm`);
      setText(ambienteElements.taxaOcupacao, `${formatNumber(cards.taxaOcupacao)} %`);
      setText(ambienteElements.hvacLigado, `${formatNumber(cards.hvacLigadoPercent)} %`);
      setText(ambienteElements.conforto, cards.conforto || "--");
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
})();