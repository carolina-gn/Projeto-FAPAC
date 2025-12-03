const params = new URLSearchParams(window.location.search);
    const status = params.get('status');

    const titleEl = document.getElementById('statusTitle');
    const msgEl = document.getElementById('statusMessage');
    const btnEl = document.getElementById('actionButton');

    if (status === 'success') {
      titleEl.textContent = 'Login bem sucedido!';
      msgEl.textContent = '';
      btnEl.textContent = 'Proceder para o Modelo';
      btnEl.onclick = () => window.location.href = '/';
    } else {
      titleEl.textContent = 'Erro de login!';
      msgEl.textContent = 'O seu nome de utilizador ou palavra-passe estão incorretos.';
      btnEl.textContent = 'Tentar Novamente';
      btnEl.onclick = () => window.location.href = '/login';
    }