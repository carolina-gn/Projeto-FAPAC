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

  function show(el) {
    el.hidden = false;
    el.classList.remove("hidden");
  }

  function hide(el) {
    el.hidden = true;
    el.classList.add("hidden");
  }

  // Expose globally
  window.showIssuesBoard = function () {
    hide(viewerWrapper);
    hide(sidePanel);
    hide(issueCreatorPanel);
    show(issuesBoardPage);

    // ✅ impede scroll fantasma no body
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);
  };

  window.showViewer = function () {
    show(viewerWrapper);
    show(sidePanel);
    show(issueCreatorPanel);
    hide(issuesBoardPage);

    // ✅ repõe scroll normal
    document.body.style.overflow = "";
  };

  const viewAllBtn = document.getElementById("viewAllIssues");
  viewAllBtn?.addEventListener("click", () => {
    window.showIssuesBoard();
  });
})();