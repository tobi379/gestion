document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('configForm');
  const usernameInput = document.getElementById('username');
  const currentPasswordInput = document.getElementById('currentPassword');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');

  let userId;

  // Obtén el userId (puedes usar un endpoint separado para obtenerlo, o almacenarlo en localStorage)
  try {
    const user = await window.electronAPI.invoke('get-logged-user'); // Crea este manejador para devolver el usuario logueado.
    userId = user.id;
  } catch (error) {
    console.error('Error al obtener el usuario logueado:', error);
    showNotification('No se pudo obtener el usuario actual. Intenta nuevamente.', 'error');
    return;
  }

  // Mostrar notificaciones
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `p-4 mb-4 text-sm rounded-lg ${
      type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`;
    notification.textContent = message;

    form.prepend(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000); // Eliminar después de 3 segundos
  }

  // Validar formulario
  function validateForm() {
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (newPassword && newPassword !== confirmPassword) {
      showNotification('Las contraseñas no coinciden.', 'error');
      return false;
    }

    return true;
  }

  // Manejar el envío del formulario
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const data = {
        userId, // Asegúrate de incluir el userId
        username: usernameInput.value.trim(),
        currentPassword: currentPasswordInput.value.trim(),
        newPassword: newPasswordInput.value.trim(),
    };

    try {
        const result = await window.electronAPI.updateUserConfig(data);

        showNotification(result.message || 'Cambios guardados exitosamente.', 'success');
        form.reset(); // Reiniciar el formulario tras éxito
    } catch (error) {
        // Extraer el mensaje del error
        const errorMessage = error?.message || error?.toString() || 'No se pudo actualizar la información.';
        
        // Manejar el mensaje específico
        const userFriendlyMessage =
            errorMessage.includes('La contraseña actual es incorrecta.')
                ? 'La contraseña actual es incorrecta.'
                : errorMessage;

        console.error('Error al actualizar los datos del usuario:', error);
        showNotification(userFriendlyMessage, 'error');
    }
  });
});
