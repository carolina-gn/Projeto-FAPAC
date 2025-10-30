// viewer.js

let viewer;
let accessToken;
let urna;

function initializeViewer(token) {
    accessToken = token;

    const options = {
        env: 'AutodeskProduction2',
        api: 'streamingV2',
        getAccessToken: function (onTokenReady) {
            const timeInSeconds = 3600;
            onTokenReady(accessToken, timeInSeconds);
        }
    };

    Autodesk.Viewing.Initializer(options, function () {
        const containerDiv = document.getElementById('viewerContainer');
        viewer = new Autodesk.Viewing.GuiViewer3D(containerDiv);
        viewer.start();
        console.log('Viewer initialized.');
    });
}

function loadModel() {
    urna = document.getElementById('modelUrn').value.trim();
    if (!urna) {
        alert('Please enter a version URN.');
        return;
    }
    if (!viewer) {
        alert('Viewer not initialized.');
        return;
    }

    const documentId = `urn:${urna}`;
    Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess, onDocumentLoadFailure);
}

function onDocumentLoadSuccess(doc) {
    const model = doc.getRoot().getDefaultGeometry();
    viewer.loadDocumentNode(doc, model);
    console.log('Model loaded successfully.');
}

function onDocumentLoadFailure(errCode) {
    console.error('Error loading document:', errCode);
}

document.getElementById('loadModelBtn').addEventListener('click', loadModel);
