document.addEventListener('DOMContentLoaded', async function () {
  const loginForm = document.getElementById('loginForm');
  const notification = document.getElementById('notification');
  const resetLink = document.querySelector('.text-sky-600'); // Enlace de resetear credenciales
  const modalReset = document.getElementById('modalReset'); // Modal de confirmación
  const cancelReset = document.getElementById('cancelReset');
  const confirmReset = document.getElementById('confirmReset');

  // Función para mostrar notificaciones
  function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = ''; // Limpia clases anteriores
    switch (type) {
      case 'success':
        notification.classList.add(
          'bg-green-100',
          'border-green-500',
          'text-green-700',
          'px-4',
          'py-3',
          'rounded'
        );
        break;
      case 'error':
        notification.classList.add(
          'bg-red-100',
          'border-red-500',
          'text-red-700',
          'px-4',
          'py-3',
          'rounded'
        );
        break;
      default:
        notification.classList.add(
          'bg-blue-100',
          'border-blue-500',
          'text-blue-700',
          'px-4',
          'py-3',
          'rounded'
        );
    }
    notification.style.display = 'block';
    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }

  // Enviar credenciales al backend
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
  
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
  
    // Validar campos vacíos
    if (!username || !password) {
      showNotification('Por favor, completa todos los campos.', 'error');
      return;
    }
  
    try {
      // Llamada al manejador IPC para el inicio de sesión
      const response = await window.electronAPI.invoke('login', {
        username,
        password,
      });
  
      showNotification(response.message, 'success');
      localStorage.setItem('token', response.token); // Guardar el token (si es necesario para futuras operaciones)
  
      setTimeout(() => {
        window.location.href = './index.html'; // Redirigir después del inicio de sesión
      }, 2000);
    } catch (error) {
      // Capturar mensaje desde el backend o usar un mensaje predeterminado
      const errorMessage =
        error.message || (typeof error === 'object' ? JSON.stringify(error) : 'No se pudo iniciar sesión.');
      console.error('Error en el inicio de sesión:', error);
  
      // Mostrar mensaje de error en la notificación
      showNotification(
        errorMessage.includes('Usuario o contraseña incorrectos.')
          ? 'Usuario o contraseña incorrectos.'
          : 'Error al iniciar sesión. Por favor, verifica tus datos.',
        'error'
      );
    }
  });  

  // Mostrar modal de confirmación para resetear credenciales
  resetLink.addEventListener('click', (event) => {
    event.preventDefault();
    modalReset.classList.remove('hidden'); // Mostrar modal
  });

  // Cerrar modal de confirmación
  cancelReset.addEventListener('click', () => {
    modalReset.classList.add('hidden'); // Ocultar modal
  });

  // Confirmar reseteo de credenciales
  confirmReset.addEventListener('click', async () => {
    try {
      // Invocar el manejador para resetear credenciales
      await window.electronAPI.invoke('reset-credentials');
      showNotification('Usuario y contraseña reseteados a valores predeterminados.', 'success');
      modalReset.classList.add('hidden'); // Ocultar modal tras confirmar
    } catch (error) {
      console.error('Error al resetear credenciales:', error);
      showNotification('No se pudo resetear usuario y contraseña. Intenta nuevamente.', 'error');
    }
  });

  // Manejar actualizaciones automáticas
  const updateNotification = (message) => {
    notification.textContent = message;
    notification.style.display = 'block';
  };

  // Escuchar eventos de actualización
  window.electronAPI.on('update_available', () => {
    notification.textContent = 'Nueva actualización disponible. Descargando...';
    notification.className = 'bg-blue-100 border-blue-500 text-blue-700 px-4 py-3 rounded';
    notification.style.display = 'block';
  });

  window.electronAPI.on('update_downloaded', () => {
    notification.textContent = 'La actualización está lista. Reinicia para instalar.';
    notification.className = 'bg-green-100 border-green-500 text-green-700 px-4 py-3 rounded';
    notification.style.display = 'block';

    // Botón para reiniciar
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Reiniciar ahora';
    restartButton.className = 'bg-green-500 text-white font-bold px-4 py-2 rounded';
    restartButton.addEventListener('click', () => {
      window.electronAPI.invoke('restart-app');
    });
    notification.appendChild(restartButton);
  });
});
