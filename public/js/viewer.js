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
    highlightByName(elementName) {
        if (!this.viewer) return console.warn("Viewer not initialized");

        const models = this.viewer.getVisibleModels();
        if (!models.length) return console.warn("No visible models");

        let found = false;

        models.forEach(model => {
            const tree = model.getData().instanceTree;
            if (!tree) return;

            const dbIds = [];
            tree.enumNodeChildren(tree.getRootId(), dbId => {
                if (tree.getNodeName(dbId) === elementName) dbIds.push(dbId);
            }, true);

            if (!dbIds.length) return;
            found = true;

            // Highlight using selector
            this.viewer.impl.selector.setSelection(dbIds, false, 0);

            // Zoom to selected nodes
            const bounds = this.viewer.impl.selector.getSelectionBounds();
            if (bounds && !bounds.isEmpty()) {
                this.viewer.navigation.fitBounds(true, bounds);
            }

            this.viewer.impl.invalidate(true);
        });

        if (!found) console.warn("Element not found:", elementName);
    }
}

// Attach globally
window.TandemViewer = TandemViewer;