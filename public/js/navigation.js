// navigation.js
(function () {
  const viewerColumn = document.querySelector(".viewer-column");
  const sidePanel = document.querySelector(".side-panel");
  const issuesBoardPage = document.getElementById("issuesBoardPage");
  const dashboardPage = document.getElementById("dashboardPage");
  const alertsPage = document.getElementById("alertsPage");
  const issueCreatorPanel = document.querySelector("aside.issue-panel");

  if (!viewerColumn || !sidePanel || !issuesBoardPage || !dashboardPage || !issueCreatorPanel) {
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
    show(alertsPage);

    document.body.style.overflow = "auto";
    window.scrollTo(0, 0);
  };

  window.showViewer = function () {
    show(viewerColumn);
    show(sidePanel);
    show(issueCreatorPanel);
    hide(issuesBoardPage);
    hide(dashboardPage);
    hide(alertsPage);

    document.body.style.overflow = "";
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
})();