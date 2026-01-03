async function initializeTandemViewer() {
  try {
    const tokenResponse = await fetch('/api/auth/token');
    if (!tokenResponse.ok) {
      console.error('Token endpoint failed:', tokenResponse.status);
      return;
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error('No access token found.', tokenData);
      return;
    }

    const div = document.getElementById('viewerContainer');
    window.tandemViewerInstance = await new tandemViewer(div, tokenData.access_token);

    document.getElementById('loadModelBtn').disabled = false;
    console.log('Viewer initialized.');
  } catch (err) {
    console.error('Failed to initialize viewer:', err);
    alert('Failed to initialize viewer. Check console for details.');
  }
}

initializeTandemViewer();
