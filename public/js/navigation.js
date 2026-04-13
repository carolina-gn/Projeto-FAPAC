// navigation.js
(function () {
  const viewerColumn = document.querySelector(".viewer-column");
  const sidePanel = document.querySelector(".side-panel");
  const issuesBoardPage = document.getElementById("issuesBoardPage");
  const dashboardPage = document.getElementById("dashboardPage");
  const alertsPage = document.getElementById("alertsPage");
  const analysisPage = document.getElementById("analysisPage");
  const issueCreatorPanel = document.querySelector("aside.issue-panel");

  if (!viewerColumn || !sidePanel || !issuesBoardPage || !dashboardPage || !alertsPage || !analysisPage || !issueCreatorPanel) {
    console.warn("Some navigation elements were not found.");
    return;
  }

  function show(el) {
    el.hidden = false;
    el.classList.remove("hidden");
  }

  function hide(el) {
    el.hidden = true;
    el.classList.add("hidden");
  }

  window.showIssuesBoard = function () {
    hide(viewerColumn);
    hide(sidePanel);
    hide(issueCreatorPanel);
    hide(dashboardPage);
    show(issuesBoardPage);

    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);
  };

  window.showDashboard = function () {
    hide(viewerColumn);
    hide(sidePanel);
    hide(issueCreatorPanel);
    hide(issuesBoardPage);
    show(dashboardPage);

    document.body.style.overflow = "auto";
    window.scrollTo(0, 0);
  };

  window.showAlertsPage = function () {
    hide(viewerColumn);
    hide(sidePanel);
    hide(issueCreatorPanel);
    hide(issuesBoardPage);
    hide(dashboardPage);
    hide(analysisPage);
    show(alertsPage);

    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);
  };

    window.showAnalysisPage = function () {
    hide(viewerColumn);
    hide(sidePanel);
    hide(issueCreatorPanel);
    hide(issuesBoardPage);
    hide(dashboardPage);
    hide(alertsPage);
    show(analysisPage);

    document.body.style.overflow = "auto";
    window.scrollTo(0, 0);

    if (typeof window.loadIssuesAnalytics === "function") {
      window.loadIssuesAnalytics();
    }
  };

  window.showViewer = function () {
    show(viewerColumn);
    show(sidePanel);
    show(issueCreatorPanel);
    hide(issuesBoardPage);
    hide(dashboardPage);
    hide(alertsPage);
    hide(analysisPage);

    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);
  };

  const viewAllBtn = document.getElementById("viewAllIssues");
  viewAllBtn?.addEventListener("click", () => {
    window.showIssuesBoard();
  });

  const openDashboardBtn = document.getElementById("openDashboardBtn");
  openDashboardBtn?.addEventListener("click", () => {
    window.showDashboard();
  });

  const openAlertsBtn = document.getElementById("openAlertsBtn");
    openAlertsBtn?.addEventListener("click", () => {
      window.showAlertsPage();
   });

  const openAnalysisBtn = document.getElementById("openAnalysisBtn");
  openAnalysisBtn?.addEventListener("click", () => {
    window.showAnalysisPage();
  });
})();