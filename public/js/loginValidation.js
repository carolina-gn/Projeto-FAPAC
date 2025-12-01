const params = new URLSearchParams(window.location.search);
    const status = params.get('status');

    const titleEl = document.getElementById('statusTitle');
    const msgEl = document.getElementById('statusMessage');
    const btnEl = document.getElementById('actionButton');

    if (status === 'success') {
      titleEl.textContent = 'Login Successful';
      msgEl.textContent = 'You can now enter the homepage.';
      btnEl.textContent = 'Go to Homepage';
      btnEl.onclick = () => window.location.href = '/';
    } else {
      titleEl.textContent = 'Login Failed';
      msgEl.textContent = 'Your username or password was incorrect.';
      btnEl.textContent = 'Try Again';
      btnEl.onclick = () => window.location.href = '/login';
    }