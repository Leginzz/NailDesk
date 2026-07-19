// ============================================================
// NailDesk — Admin: Configuración del Banner de Upgrade
// ============================================================

import supabase from '../../supabase.js';

export async function renderAdminBanner() {
  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-terracota-500"></div></div>`;

  const { data: config } = await supabase
    .from('banner_config')
    .select('*')
    .maybeSingle();

  content.innerHTML = `
    <div class="max-w-2xl mx-auto space-y-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">Configuración del Banner de Upgrade</h3>
        <p class="text-sm text-gray-500 mt-1">Edita el banner que ven los usuarios del plan gratuito para invitarlos a mejorar su plan.</p>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 p-6">
        <form id="banner-form" class="space-y-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900">Banner activo</p>
              <p class="text-xs text-gray-500">Mostrar u ocultar el banner para usuarios Free</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="banner-activo" class="sr-only peer" ${config?.activo ? 'checked' : ''}>
              <div class="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-terracota-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-terracota-500"></div>
            </label>
          </div>

          <div>
            <label class="form-label">Título del banner</label>
            <input type="text" id="banner-titulo" value="${config?.titulo || ''}" class="form-input" placeholder="Ej: Desbloquea todo tu potencial">
          </div>

          <div>
            <label class="form-label">Mensaje</label>
            <textarea id="banner-mensaje" rows="3" class="form-input" placeholder="Describe los beneficios del plan de pago...">${config?.mensaje || ''}</textarea>
          </div>

          <div>
            <label class="form-label">Texto del botón CTA</label>
            <input type="text" id="banner-cta" value="${config?.cta_texto || ''}" class="form-input" placeholder="Ej: Mejorar a Básico — $299/mes">
          </div>

          <div>
            <label class="form-label">Número de WhatsApp (con código de país)</label>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500">wa.me/</span>
              <input type="text" id="banner-whatsapp" value="${config?.whatsapp_numero || ''}" class="form-input flex-1" placeholder="527831391020">
            </div>
            <p class="text-xs text-gray-400 mt-1">Incluye el código de país sin +. Ej: 52 para México</p>
          </div>

          <!-- Preview -->
          <div>
            <label class="form-label">Vista previa</label>
            <div class="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <div class="bg-gradient-to-r from-terracota-500 to-terracota-600 rounded-xl p-4 text-white">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <i data-lucide="lock" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <p class="font-bold text-sm" id="preview-titulo">${config?.titulo || 'Título del banner'}</p>
                    <p class="text-xs text-white/80 mt-0.5" id="preview-mensaje">${config?.mensaje || 'Mensaje del banner'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="submit" class="btn btn-primary px-6 py-2.5 text-sm">
              <i data-lucide="save" class="w-4 h-4 mr-1"></i>Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  // Live preview
  document.getElementById('banner-titulo')?.addEventListener('input', (e) => {
    document.getElementById('preview-titulo').textContent = e.target.value || 'Título del banner';
  });
  document.getElementById('banner-mensaje')?.addEventListener('input', (e) => {
    document.getElementById('preview-mensaje').textContent = e.target.value || 'Mensaje del banner';
  });

  // Save
  document.getElementById('banner-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      activo: document.getElementById('banner-activo').checked,
      titulo: document.getElementById('banner-titulo').value.trim(),
      mensaje: document.getElementById('banner-mensaje').value.trim(),
      cta_texto: document.getElementById('banner-cta').value.trim(),
      whatsapp_numero: document.getElementById('banner-whatsapp').value.trim(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('banner_config').update(data).eq('id', config.id);
    if (error) {
      showToast('Error al guardar: ' + error.message, 'error');
    } else {
      showToast('Configuración guardada');
    }
  });
}

function showToast(msg) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm shadow-lg';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
