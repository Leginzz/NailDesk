// ============================================================
// NailDesk — Equipo View
// ============================================================

import supabase from '../supabase.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../utils/escape-html.js';

export async function renderEquipo() {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="skeleton skeleton-card" style="height:48px;margin-bottom:1.5rem"></div>
    <div class="skeleton skeleton-card" style="height:280px"></div>
  `;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: equipo } = await supabase.from('equipo_herramientas').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  const totalEquipo = equipo?.reduce((s, e) => s + Number(e.costo_compra), 0) || 0;

  container.innerHTML = `
    <div class="section-header animate-in">
      <div class="stat-row">
        <p class="text-sm" style="color:var(--terracota-400)">${equipo?.length || 0} herramientas</p>
        <div class="section-divider"></div>
        <p class="text-sm" style="color:var(--terracota-300)">Inversión: <span class="font-semibold" style="color:var(--charcoal)">$${totalEquipo.toLocaleString('es-MX')}</span></p>
      </div>
      <button class="btn btn-primary" id="btn-add-equipo"><i data-lucide="plus" class="w-4 h-4"></i> Nueva Herramienta</button>
    </div>

    <div class="card-elevated overflow-hidden animate-in stagger-1">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead><tr><th>Herramienta</th><th>Costo compra</th><th>Vida útil</th><th>Costo/servicio</th><th></th></tr></thead>
          <tbody>
            ${equipo?.map(e => `
              <tr>
                <td class="font-semibold" style="color:var(--charcoal)">${escapeHtml(e.herramienta)}</td>
                <td>$${Number(e.costo_compra).toLocaleString('es-MX')}</td>
                <td><span class="badge badge-info">${e.vida_util_servicios.toLocaleString()} usos</span></td>
                <td class="font-bold" style="color:var(--terracota-600)">$${Number(e.costo_por_servicio).toFixed(2)}</td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn btn-ghost btn-edit-eq" data-id="${e.id}" style="padding:0.375rem"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                    <button class="btn btn-ghost btn-delete-eq" data-id="${e.id}" style="padding:0.375rem"><i data-lucide="trash-2" class="w-4 h-4" style="color:#dc6b4a"></i></button>
                  </div>
                </td>
              </tr>
            `).join('') || `
              <tr><td colspan="5" class="text-center py-16">
                <div class="empty-state">
                  <div class="empty-state-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                  </div>
                  <h3>No hay herramientas</h3>
                  <p>Agrega herramientas para distribuir su costo entre servicios.</p>
                </div>
              </td></tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  document.getElementById('btn-add-equipo').addEventListener('click', () => openEquipoModal(null, user));

  container.querySelectorAll('.btn-edit-eq').forEach(btn => {
    btn.addEventListener('click', () => { const e = equipo.find(x => x.id === btn.dataset.id); if (e) openEquipoModal(e); });
  });

  container.querySelectorAll('.btn-delete-eq').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar esta herramienta?')) return;
      await supabase.from('equipo_herramientas').delete().eq('id', btn.dataset.id);
      showToast('Herramienta eliminada'); renderEquipo();
    });
  });
}

function openEquipoModal(item = null, user = null) {
  const isEdit = !!item;
  openModal(`
    <form id="equipo-form" class="space-y-4">
      <div><label class="form-label">Nombre</label><input type="text" id="e-herramienta" class="form-input" value="${escapeHtml(item?.herramienta) || ''}" required placeholder="Ej: Micromotor"></div>
      <div class="grid grid-cols-2 gap-4">
        <div><label class="form-label">Costo compra</label><input type="number" step="0.01" id="e-costo" class="form-input" value="${item?.costo_compra || 0}" required></div>
        <div><label class="form-label">Vida útil (servicios)</label><input type="number" id="e-vida" class="form-input" value="${item?.vida_util_servicios || 3000}" required></div>
      </div>
      <p class="text-xs" style="color:var(--terracota-300)">Costo por servicio se calcula: costo ÷ vida útil</p>
      <div class="flex gap-3 pt-2">
        <button type="button" class="btn btn-secondary flex-1" onclick="document.getElementById('modal-close-btn').click()">Cancelar</button>
        <button type="submit" class="btn btn-primary flex-1">${isEdit ? 'Guardar' : 'Crear'}</button>
      </div>
    </form>
  `, { title: isEdit ? 'Editar Herramienta' : 'Nueva Herramienta' });

  document.getElementById('equipo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      herramienta: document.getElementById('e-herramienta').value,
      costo_compra: Number(document.getElementById('e-costo').value),
      vida_util_servicios: Number(document.getElementById('e-vida').value),
    };
    if (isEdit) { await supabase.from('equipo_herramientas').update(data).eq('id', item.id); showToast('Herramienta actualizada'); }
    else { await supabase.from('equipo_herramientas').insert({ ...data, user_id: user?.id }); showToast('Herramienta creada'); }
    closeModal(); renderEquipo();
  });
}
