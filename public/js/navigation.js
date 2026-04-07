// navigation.js
(function () {
  const viewerWrapper = document.querySelector(".viewer-wrapper");
  const sidePanel = document.querySelector(".side-panel");
  const issuesBoardPage = document.getElementById("issuesBoardPage");
  const dashboardPage = document.getElementById("dashboardPage");
  const issueCreatorPanel = document.querySelector("aside.issue-panel");

  if (!viewerWrapper || !sidePanel || !issuesBoardPage || !dashboardPage || !issueCreatorPanel) {
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
    hide(viewerWrapper);
    hide(sidePanel);
    hide(issueCreatorPanel);
    hide(dashboardPage);
    show(issuesBoardPage);

    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);
  };

  window.showDashboard = function () {
    hide(viewerWrapper);
    hide(sidePanel);
    hide(issueCreatorPanel);
    hide(issuesBoardPage);
    show(dashboardPage);

    document.body.style.overflow = "auto";
    window.scrollTo(0, 0);
  };

  window.showViewer = function () {
    show(viewerWrapper);
    show(sidePanel);
    show(issueCreatorPanel);
    hide(issuesBoardPage);
    hide(dashboardPage);

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
})();