// viewer.js
async function main() {
    const div = document.getElementById("viewerContainer");

    // Initialize Tandem Viewer
    const tandem = await new tandemViewer(div);

    // Fetch all facilities shared with your Client ID
    const facilities = await tandem.fetchFacilities();

    // Open the first facility (or let user select)
    await tandem.openFacility(facilities[0]);
}

class tandemViewer {
    constructor(div, token) {
        return new Promise(async resolve => {
            const _access_token = token;

            const options = {
                env: "DtProduction",
                api: 'dt',
                productId: 'Digital Twins',
                corsWorker: true,
            };

            const av = Autodesk.Viewing;
            av.Initializer(options, () => {
                this.viewer = new av.GuiViewer3D(div, {
                    extensions: ['Autodesk.BoxSelection'],
                    screenModeDelegate: av.NullScreenModeDelegate,
                    theme: 'light-theme',
                });
                this.viewer.start();
                av.endpoint.HTTP_REQUEST_HEADERS['Authorization'] = `Bearer ${_access_token}`;
                this.app = new Autodesk.Tandem.DtApp();
                resolve(this);
            });
        });
    }

    async fetchFacilities() {
        const shared = await this.app.getCurrentTeamsFacilities();
        const mine = await this.app.getUsersFacilities();
        return [...shared, ...mine];
    }

    async openFacility(facility) {
        await this.app.displayFacility(facility, false, this.viewer);
    }
}