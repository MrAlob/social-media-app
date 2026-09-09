export function showConfirmDialog({
  title = 'Confirm action',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
} = {}) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'confirm-modal-backdrop';

    const dialog = document.createElement('div');
    dialog.className =
      'confirm-modal border-white/80 bg-white/72 shadow-2xl shadow-slate-900/20 backdrop-blur-xl';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', title);

    dialog.innerHTML = `
      <p class="confirm-modal-icon" aria-hidden="true">⚠️</p>
      <h2 class="confirm-modal-title"></h2>
      <p class="confirm-modal-message"></p>
      <div class="confirm-modal-actions">
        <button type="button" class="confirm-modal-cancel border-white/75 bg-white/48 backdrop-blur-md">${cancelText}</button>
        <button type="button" class="confirm-modal-confirm border-white/75 bg-white/48 backdrop-blur-md${danger ? ' is-danger' : ''}">${confirmText}</button>
      </div>
    `;

    const titleElement = dialog.querySelector('.confirm-modal-title');
    const messageElement = dialog.querySelector('.confirm-modal-message');
    const cancelButton = dialog.querySelector('.confirm-modal-cancel');
    const confirmButton = dialog.querySelector('.confirm-modal-confirm');

    if (!titleElement || !messageElement || !cancelButton || !confirmButton) {
      resolve(false);
      return;
    }

    titleElement.textContent = title;
    messageElement.textContent = message;

    function cleanup(result) {
      document.removeEventListener('keydown', onKeyDown);
      backdrop.remove();
      resolve(result);
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        cleanup(false);
      }
    }

    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) {
        cleanup(false);
      }
    });

    cancelButton.addEventListener('click', () => {
      cleanup(false);
    });

    confirmButton.addEventListener('click', () => {
      cleanup(true);
    });

    backdrop.append(dialog);
    document.body.append(backdrop);
    document.addEventListener('keydown', onKeyDown);
    confirmButton.focus();
  });
}
