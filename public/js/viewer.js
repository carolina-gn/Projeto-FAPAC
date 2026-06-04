class TandemViewer {
  constructor(container, token) {
    return new Promise((resolve, reject) => {
      try {
        const av = Autodesk.Tandem;

        const options = {
          env: "DtProduction",
          api: "dt",
          productId: "Digital Twins",
          corsWorker: true,
          accessToken: token,
          getAccessToken: function (onTokenReady) {
            onTokenReady(token, 3599);
          }
        };

        av.Initializer(options, async () => {
          // Initialize viewer
          this.viewer = new Autodesk.Tandem.DtGuiViewer3D(container, {
            extensions: [
              "Autodesk.Tandem.Section",
              "Autodesk.Tandem.Measure",
              "Autodesk.BimWalk"
            ],
            screenModeDelegate: Autodesk.Viewing.NullScreenModeDelegate,
            theme: "light-theme",
          });
          this.viewer.start();

          // Output selected element
          const out = document.getElementById("selectedElementId");
          if (out) out.textContent = "(clique num objeto)";

          const canvas = this.viewer.canvas;
          if (canvas) {
            canvas.style.pointerEvents = "auto";

            canvas.addEventListener("click", async (ev) => {
            try {
                const rect = canvas.getBoundingClientRect();
                const x = ev.clientX - rect.left;
                const y = ev.clientY - rect.top;

                const hit = this.viewer.impl.hitTest(x, y, true);
                const dbId = hit?.dbId;

                const outEl = document.getElementById("selectedElementId");
                const inputEl = document.getElementById("modelElement");

                if (!dbId) {
                if (outEl) outEl.textContent = "Clique no vazio (sem objeto).";
                if (inputEl) inputEl.value = '';
                window.selectedElementId = null;
                return;
                }

                if (!this.viewer) return;

                const elementIds = await this.getElementIdsFromDbIds([dbId]);
                const elementId = elementIds[0] || null;

                // Store Tandem externalId
                window.selectedElementId = elementId;

                // Update UI
                if (outEl) outEl.textContent = dbId;
                if (inputEl) inputEl.value = hit?.name || `Objeto ${dbId}`;

            } catch (err) {
                console.error(err);
                const outEl = document.getElementById("selectedElementId");
                if (outEl) outEl.textContent = "Erro ao identificar o objeto (ver console).";
            }
            });

          }

          // Set Tandem API auth header
          Autodesk.Tandem.endpoint.HTTP_REQUEST_HEADERS["Authorization"] = `Bearer ${token}`;
          this.app = new Autodesk.Tandem.DtApp();

          resolve(this);
        });
      } catch (err) {
        console.error("Viewer initialization error:", err);
        reject(err);
      }
    });
  }

  async openFacility(facility) {
    if (!facility?.twinId) throw new Error("Facility must have twinId");

    try {
      const allFacilities = [
        ...(await this.app.getSharedFacilities()) || [],
        ...(await this.app.getCurrentTeamsFacilities()) || []
      ];

      const target = allFacilities.find(f => f.urn === facility.twinId || f.twinId === facility.twinId);
      if (!target) throw new Error(`Facility "${facility.name}" not found in Tandem`);

      await this.app.displayFacility(target, null, this.viewer);

      // Wait for at least one model
      await new Promise(resolve => {
        const interval = setInterval(() => {
          if (this.viewer.impl.modelQueue.length > 0) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });

      this.viewer.impl.invalidate(true);
      console.log(`Facility "${facility.name}" loaded.`);
    } catch (err) {
      console.error('Failed to open facility:', err);
      alert(`Falha ao abrir o modelo "${facility.name}". Veja console.`);
    }
  }

  // Highlight an element using its Tandem externalId
  async highlightByElementId(elementId) {
    if (!this.viewer || !elementId) return;

    const model = this.viewer.getVisibleModels()[0];
    if (!model || typeof model.getDbIdsFromElementIds !== "function") return;

    const dbIds = await model.getDbIdsFromElementIds([elementId]);
    if (!dbIds?.length) return console.warn("No dbIds found for elementId", elementId);

    this.viewer.impl.selector.clearSelection();
    this.viewer.impl.selector.setSelection(dbIds);

    const bounds = this.viewer.impl.selector.getSelectionBounds();
    if (bounds) this.viewer.navigation.fitBounds(true, bounds);
  }

  // Convert dbId → Tandem elementId (externalId)
  async getElementIdsFromDbIds(dbIds) {
    if (!this.viewer) return [];
    const model = this.viewer.getVisibleModels()[0];
    if (!model || typeof model.getElementIdsFromDbIds !== "function") return [];
    return await model.getElementIdsFromDbIds(dbIds);
  }
}

// Attach globally
window.TandemViewer = TandemViewer;