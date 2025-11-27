class tandemViewer {
    constructor(div, token) {
        return new Promise(resolve => {
            const av = Autodesk.Viewing;

            const options = {
                env: "DtProduction",
                api: 'dt',
                productId: 'Digital Twins',
                corsWorker: true,
            };

            av.Initializer(options, async () => {
                this.viewer = new av.GuiViewer3D(div, {
                    extensions: ['Autodesk.BoxSelection'],
                    screenModeDelegate: av.NullScreenModeDelegate,
                    theme: 'light-theme',
                });
                this.viewer.start();

                av.endpoint.HTTP_REQUEST_HEADERS['Authorization'] = `Bearer ${token}`;

                this.app = new Autodesk.Tandem.DtApp();

                resolve(this);
            });
        });
    }

    async fetchFacilities() {
        try {
            const shared = await this.app.getSharedFacilities();
            const teams = await this.app.getCurrentTeamsFacilities();
            return [...(shared || []), ...(teams || [])];
        } catch (err) {
            console.error('Failed to fetch facilities:', err);
            alert('Unable to fetch facilities. Check your permissions or token.');
            return [];
        }
    }

    async openFacility(facility) {
    try {
        await this.app.displayFacility(facility, false, this.viewer);

        // Poll until the model is in the viewer.impl.modelQueue
        const impl = this.viewer.impl;
        const waitForModel = () => new Promise(resolve => {
            const interval = setInterval(() => {
                if (impl.modelQueue.length > 0) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
        await waitForModel();

        // Fit the facility safely
        Autodesk.Viewing.Private.fitToView(this.viewer.impl);
        this.viewer.impl.invalidate(true);

    } catch (err) {
        console.error('Failed to open facility:', err);
        alert('Failed to open facility. See console for details.');
    }
}
}

async function loadModelFromInput() {
    const input = document.getElementById('modelUrn').value.trim();
    if (!input) return alert('Please enter a facility URN');

    const facilities = await window.tandemViewerInstance.fetchFacilities();

    console.log('Facilities:', facilities);

    // Match the facility by twinId
    const facility = facilities.find(f => f.twinId === input);

    if (!facility) return alert('Invalid facility URN');

    try {
        await window.tandemViewerInstance.openFacility(facility);
    } catch (err) {
        console.error('Failed to open facility:', err);
        alert('Failed to open facility. Check console for details.');
    }
}

// Attach to button
document.getElementById('loadModelBtn').addEventListener('click', loadModelFromInput);