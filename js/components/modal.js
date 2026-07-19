// ============================================================
// NailDesk — Modal Component
// ============================================================

const overlay = document.getElementById('modal-overlay');
const content = document.getElementById('modal-content');

let onCloseCallback = null;

export function openModal(html, options = {}) {
  content.innerHTML = `
    <div class="p-6">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-semibold text-gray-900">${options.title || ''}</h2>
        <button id="modal-close-btn" class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <i data-lucide="x" class="w-5 h-5 text-gray-400"></i>
        </button>
      </div>
      <div id="modal-body">${html}</div>
    </div>
  `;

  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  onCloseCallback = options.onClose || null;

  if (window.lucide) lucide.createIcons();

  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

export function closeModal() {
  overlay.classList.add('hidden');
  document.body.style.overflow = '';
  content.innerHTML = '';
  if (onCloseCallback) onCloseCallback();
  onCloseCallback = null;
}

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
    closeModal();
  }
});
