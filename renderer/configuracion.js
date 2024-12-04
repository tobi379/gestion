document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('configForm');
  const usernameInput = document.getElementById('username');
  const currentPasswordInput = document.getElementById('currentPassword');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const modal = document.getElementById('modalConfirm');
  const cancelModal = document.getElementById('cancelModal');
  const confirmModal = document.getElementById('confirmModal');

  let userId;

  // Obtener usuario actual
  try {
    const user = await window.electronAPI.invoke('get-logged-user');
    userId = user.id;
  } catch (error) {
    console.error('Error al obtener el usuario logueado:', error);
    showNotification('No se pudo obtener el usuario actual.', 'error');
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
    setTimeout(() => notification.remove(), 3000);
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

  // Abrir modal de confirmación
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    modal.classList.remove('hidden'); // Mostrar modal
  });

  // Cancelar cambios
  cancelModal.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Confirmar cambios
  confirmModal.addEventListener('click', async () => {
    const data = {
      userId,
      username: usernameInput.value.trim() || null,
      currentPassword: currentPasswordInput.value.trim(),
      newPassword: newPasswordInput.value.trim() || null,
    };

    try {
      const result = await window.electronAPI.updateUserConfig(data);
      showNotification(result.message || 'Cambios guardados exitosamente.', 'success');
      form.reset();
    } catch (error) {
      const errorMessage =
        error.message.includes('La contraseña actual es incorrecta.')
          ? 'La contraseña actual es incorrecta.'
          : error.message;
      showNotification(errorMessage, 'error');
    } finally {
      modal.classList.add('hidden'); // Ocultar modal tras acción
    }
  });
});
