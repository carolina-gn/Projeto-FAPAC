class tandemViewer {
    constructor(div, token) {
        this.div = div;
        this.token = token;
    }

    async init() {
        const av = Autodesk.Viewing;

        // Set the token BEFORE Initializer
        av.endpoint.HTTP_REQUEST_HEADERS['Authorization'] = `Bearer ${this.token}`;

        const options = {
            env: "DtProduction",
            api: 'dt',
            productId: 'Digital Twins',
            corsWorker: true,
        };

        return new Promise(resolve => {
            av.Initializer(options, () => {
                this.viewer = new av.GuiViewer3D(this.div, {
                    extensions: ['Autodesk.BoxSelection'],
                    screenModeDelegate: av.NullScreenModeDelegate,
                    theme: 'light-theme',
                });
                this.viewer.start();
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