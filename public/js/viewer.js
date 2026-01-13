class TandemViewer {
    constructor(container, token) {
        return new Promise((resolve, reject) => {
            try {
                const av = Autodesk.Viewing;

                const options = {
                    env: "DtProduction",
                    api: 'dt',
                    productId: 'Digital Twins',
                    corsWorker: true,
                };

                av.Initializer(options, async () => {
                    // Initialize GuiViewer3D
                    this.viewer = new av.GuiViewer3D(container, {
                        extensions: ['Autodesk.BoxSelection'],
                        screenModeDelegate: av.NullScreenModeDelegate,
                        theme: 'light-theme',
                    });
                    this.viewer.start();

                    // Set Authorization header for Tandem API
                    av.endpoint.HTTP_REQUEST_HEADERS['Authorization'] = `Bearer ${token}`;

                    // Initialize Tandem app
                    this.app = new Autodesk.Tandem.DtApp();

                    resolve(this);
                });
            } catch (err) {
                console.error('Viewer initialization error:', err);
                reject(err);
            }
        });
    }

    async openFacility(facility) {
        try {
            // facility must have twinId
            if (!facility || !facility.twinId) throw new Error('Facility must have twinId');

            // Fetch available facilities from Tandem
            const allFacilities = [
                ...(await this.app.getSharedFacilities()) || [],
                ...(await this.app.getCurrentTeamsFacilities()) || []
            ];

            // Match the twinId
            const target = allFacilities.find(f => f.urn === facility.twinId || f.twinId === facility.twinId);
            if (!target) throw new Error(`Facility with twinId "${facility.twinId}" not found in Tandem`);

            await this.app.displayFacility(target, false, this.viewer);

            // Wait until model queue has at least one model
            const impl = this.viewer.impl;
            await new Promise(resolve => {
                const interval = setInterval(() => {
                    if (impl.modelQueue.length > 0) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
            });

            Autodesk.Viewing.Private.fitToView(this.viewer.impl);
            this.viewer.impl.invalidate(true);

            console.log(`Facility "${facility.name}" loaded successfully.`);
        } catch (err) {
            console.error('Failed to open facility:', err);
            if (facility.name == "Selecione um modelo") {
                alert(`Selecione um modelo para carregar.`);
            } else {
                alert(`Falha ao abrir o modelo "${facility.name}". Veja console.`);
            }
        }
    }
}

// Attach globally
window.TandemViewer = TandemViewer;