// ============================================================
// NailDesk — Extras View
// ============================================================

import supabase from '../supabase.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { escapeHtml } from '../utils/escape-html.js';

export async function renderExtras() {
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="flex items-center justify-center py-20"><div class="spinner"></div></div>`;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: extras } = await supabase.from('extras').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

  container.innerHTML = `
    <div class="section-header animate-in">
      <p class="text-sm" style="color:var(--terracota-400)">${extras?.length || 0} extras</p>
      <button class="btn btn-primary" id="btn-add-extra"><i data-lucide="plus" class="w-4 h-4"></i> Nuevo Extra</button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in-delay-1">
      ${extras?.map(ex => `
        <div class="card p-5 group">
          <div class="flex items-start justify-between mb-3">
            <h3 class="font-semibold" style="color:var(--charcoal)">${escapeHtml(ex.nombre)}</h3>
            <span class="badge ${ex.activo ? 'badge-success' : 'badge-danger'}">${ex.activo ? 'Activo' : 'Inactivo'}</span>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between text-sm"><span style="color:var(--terracota-300)">Costo</span><span style="color:var(--charcoal)">$${Number(ex.costo_aprox).toFixed(2)}</span></div>
            <div class="flex justify-between text-sm"><span style="color:var(--terracota-300)">Ganancia</span><span style="color:var(--charcoal)">${ex.porcentaje_ganancia}%</span></div>
            <div class="flex justify-between text-sm font-bold pt-2 border-t" style="border-color:var(--terracota-50)"><span style="color:var(--charcoal)">Precio</span><span style="color:var(--terracota-500)">$${Number(ex.precio_redondeado).toLocaleString('es-MX')}</span></div>
          </div>
          <div class="flex gap-2 mt-3 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity" style="border-color:var(--terracota-50)">
            <button class="btn btn-ghost btn-edit-extra text-xs" data-id="${ex.id}" style="padding:0.25rem 0.5rem"><i data-lucide="pencil" class="w-3.5 h-3.5"></i> Editar</button>
            <button class="btn btn-ghost btn-delete-extra text-xs" data-id="${ex.id}" style="padding:0.25rem 0.5rem"><i data-lucide="trash-2" class="w-3.5 h-3.5" style="color:#dc6b4a"></i></button>
          </div>
        </div>
      `).join('') || `
        <div class="col-span-full empty-state"><i data-lucide="plus-circle" class="w-12 h-12 mx-auto mb-3"></i><p class="font-medium" style="color:var(--terracota-400)">No hay extras</p></div>
      `}
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  document.getElementById('btn-add-extra').addEventListener('click', () => openExtraModal(null, user));

  container.querySelectorAll('.btn-edit-extra').forEach(btn => {
    btn.addEventListener('click', () => { const ex = extras.find(x => x.id === btn.dataset.id); if (ex) openExtraModal(ex); });
  });

  container.querySelectorAll('.btn-delete-extra').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este extra?')) return;
      await supabase.from('extras').delete().eq('id', btn.dataset.id);
      showToast('Extra eliminado'); renderExtras();
    });
  });
}

function openExtraModal(extra = null, user = null) {
  const isEdit = !!extra;
  openModal(`
    <form id="extra-form" class="space-y-4">
      <div><label class="form-label">Nombre</label><input type="text" id="ex-nombre" class="form-input" value="${extra?.nombre || ''}" required placeholder="Ej: Diseño por uña"></div>
      <div class="grid grid-cols-2 gap-4">
        <div><label class="form-label">Costo aprox</label><input type="number" step="0.01" id="ex-costo" class="form-input" value="${extra?.costo_aprox || 0}" required></div>
        <div><label class="form-label">% Ganancia</label><input type="number" id="ex-ganancia" class="form-input" value="${extra?.porcentaje_ganancia || 50}" required></div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div><label class="form-label">Precio sugerido</label><input type="number" step="0.01" id="ex-precio-sug" class="form-input" value="${extra?.precio_sugerido || 0}"></div>
        <div><label class="form-label">Precio final</label><input type="number" step="0.01" id="ex-precio" class="form-input" value="${extra?.precio_redondeado || 0}"></div>
      </div>
      <div class="flex gap-3 pt-2">
        <button type="button" class="btn btn-secondary flex-1" onclick="document.getElementById('modal-close-btn').click()">Cancelar</button>
        <button type="submit" class="btn btn-primary flex-1">${isEdit ? 'Guardar' : 'Crear'}</button>
      </div>
    </form>
  `, { title: isEdit ? 'Editar Extra' : 'Nuevo Extra' });

  document.getElementById('extra-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      nombre: document.getElementById('ex-nombre').value,
      costo_aprox: Number(document.getElementById('ex-costo').value),
      porcentaje_ganancia: Number(document.getElementById('ex-ganancia').value),
      precio_sugerido: Number(document.getElementById('ex-precio-sug').value),
      precio_redondeado: Number(document.getElementById('ex-precio').value),
    };
    if (isEdit) { await supabase.from('extras').update(data).eq('id', extra.id); showToast('Extra actualizado'); }
    else { await supabase.from('extras').insert({ ...data, user_id: user?.id }); showToast('Extra creado'); }
    closeModal(); renderExtras();
  });
}
