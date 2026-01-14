class TandemViewer {
    constructor(container, token) {
        return new Promise((resolve, reject) => {
            try {
                const av = Autodesk.Viewing;

                const options = {
                    env: "DtProduction",
                    api: "dt",
                    productId: "Digital Twins",
                    corsWorker: true,
                };

                av.Initializer(options, async () => {
                    // Initialize viewer
                    this.viewer = new av.GuiViewer3D(container, {
                        extensions: ["Autodesk.BoxSelection"],
                        screenModeDelegate: av.NullScreenModeDelegate,
                        theme: "light-theme",
                    });
                    this.viewer.start();

                    const out = document.getElementById("selectedElementId");
                        if (out) out.textContent = "(clique num objeto)";

                        const canvas = this.viewer.canvas;
                        if (canvas) {
                            canvas.style.pointerEvents = "auto";

                            canvas.addEventListener("click", (ev) => {
                                try {
                                    const rect = canvas.getBoundingClientRect();
                                    const x = ev.clientX - rect.left;
                                    const y = ev.clientY - rect.top;

                                    const hit = this.viewer.impl.hitTest(x, y, true);
                                    const dbId = hit?.dbId;

                                    const outEl = document.getElementById("selectedElementId");
                                    const inputEl = document.getElementById("modelElement");

                                    if (dbId === undefined || dbId === null) {
                                        if (outEl) outEl.textContent = "Clique no vazio (sem objeto).";
                                        if (inputEl) inputEl.value = '';
                                        window.selectedElementId = null;
                                        return;
                                    }

                                    // Set ID in "Elemento selecionado (ID)"
                                    if (outEl) outEl.textContent = dbId;
                                    window.selectedElementId = dbId;

                                    // Set Elemento name — try hit.name, else fallback
                                    const name = hit?.name || `Objeto ${dbId}`;
                                    if (inputEl) inputEl.value = name;

                                } catch (err) {
                                    console.error(err);
                                    const outEl = document.getElementById("selectedElementId");
                                    if (outEl) outEl.textContent = "Erro ao identificar o objeto (ver console).";
                                }
                            });
                        }


                    // Set Tandem API auth header
                    av.endpoint.HTTP_REQUEST_HEADERS["Authorization"] = `Bearer ${token}`;
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

            await this.app.displayFacility(target, false, this.viewer);

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
            if (facility.name == "Selecione um modelo") {
                alert(`Selecione um modelo para carregar.`);
            } else {
                alert(`Falha ao abrir o modelo "${facility.name}". Veja console.`);
            }
        }
    }

    /**
     * Highlight an element by name using selector
     */
    async highlightByElementId(elementId) {
    if (!this.viewer) return;

    const model = this.viewer.getVisibleModels()[0];
    if (!model) return;

    const dbIds = await model.getDbIdsFromElementIds([elementId]);

    if (!dbIds || !dbIds.length) {
        console.warn("No dbIds found for elementId", elementId);
        return;
    }

    // Clear previous selection
    this.viewer.impl.selector.clearSelection();

    // Select (this highlights properly)
    this.viewer.impl.selector.setSelection(dbIds);

    // Zoom to selection
    const bounds = this.viewer.impl.selector.getSelectionBounds();
    if (bounds) {
        this.viewer.navigation.fitBounds(true, bounds);
    }
}

async highlightByExternalId(externalId) {
  if (!this.viewer) return;

  const model = this.viewer.getVisibleModels?.()[0] || this.viewer.model;
  if (!model || typeof model.getExternalIdMapping !== "function") return;

  const map = await new Promise((resolve) => model.getExternalIdMapping(resolve));

  // map é do tipo: { dbId: externalId }
  const dbIdStr = Object.keys(map).find((k) => map[k] === externalId);
  if (!dbIdStr) {
    console.warn("No dbId found for externalId", externalId);
    return;
  }

  const dbIds = [Number(dbIdStr)];

  this.viewer.impl.selector.clearSelection();
  this.viewer.impl.selector.setSelection(dbIds);

  const bounds = this.viewer.impl.selector.getSelectionBounds();
  if (bounds) this.viewer.navigation.fitBounds(true, bounds);
}

}

// Attach globally
window.TandemViewer = TandemViewer;