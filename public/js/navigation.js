// navigation.js
(function () {
  const viewerWrapper = document.querySelector(".viewer-wrapper");
  const sidePanel = document.querySelector(".side-panel");
  const issuesBoardPage = document.getElementById("issuesBoardPage");
  const issueCreatorPanel = document.querySelector("aside.issue-panel");

  if (!viewerWrapper || !sidePanel || !issuesBoardPage || !issueCreatorPanel) {
    console.warn("Some navigation elements were not found.");
    return;
  }

  // Show element: remove hidden and remove .hidden
  function show(el) {
    el.hidden = false;
    el.classList.remove("hidden");
  }

  // Hide element: add hidden and .hidden
  function hide(el) {
    el.hidden = true;
    el.classList.add("hidden");
  }

  // Expose globally
  window.showIssuesBoard = function () {
    hide(viewerWrapper);
    hide(sidePanel);
    hide(issueCreatorPanel);     // hide the issue creator
    show(issuesBoardPage);       // correctly show the board
  };

  window.showViewer = function () {
    show(viewerWrapper);
    show(sidePanel);
    show(issueCreatorPanel);     // show the issue creator again
    hide(issuesBoardPage);       // hide the board
  };

  // SPA-like click
  const viewAllBtn = document.getElementById("viewAllIssues");
  viewAllBtn?.addEventListener("click", () => {
    window.showIssuesBoard();
  });
})();