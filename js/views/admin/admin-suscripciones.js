// ============================================================
// NailDesk â€” Admin: Suscripciones
// ============================================================

import supabase from '../../supabase.js';
import { openModal, closeModal } from '../../components/modal.js';
import { showToast } from '../../components/toast.js';

export async function renderAdminSuscripciones() {
  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-terracota-500"></div></div>`;

  const [subsRes, perfilesRes, planesRes] = await Promise.all([
    supabase.from('suscripciones').select('*, plan:planes_suscripcion (*)').order('created_at', { ascending: false }),
    supabase.from('perfiles_negocio').select('user_id, nombre_salon'),
    supabase.from('planes_suscripcion').select('*').eq('activo', true).order('precio_mensual'),
  ]);

  const suscripciones = subsRes.data || [];
  const planes = planesRes.data || [];
  const perfilMap = {};
  (perfilesRes.data || []).forEach(p => { perfilMap[p.user_id] = p.nombre_salon; });
  suscripciones.forEach(s => { s.perfil = { nombre_salon: perfilMap[s.user_id] || 'Sin nombre' }; });

  // Stats
  const stats = {
    total: suscripciones?.length || 0,
    activos: suscripciones?.filter(s => s.estado === 'activo').length || 0,
    trial: suscripciones?.filter(s => s.estado === 'trial').length || 0,
    suspendidos: suscripciones?.filter(s => s.estado === 'suspendido').length || 0,
    cancelados: suscripciones?.filter(s => s.estado === 'cancelado').length || 0,
  };

  content.innerHTML = `
    <div class="space-y-6">
      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div class="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p class="text-2xl font-bold text-gray-900">${stats.total}</p>
          <p class="text-xs text-gray-400 mt-1">Total</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-green-100 text-center">
          <p class="text-2xl font-bold text-green-600">${stats.activos}</p>
          <p class="text-xs text-gray-400 mt-1">Activos</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-blue-100 text-center">
          <p class="text-2xl font-bold text-blue-600">${stats.trial}</p>
          <p class="text-xs text-gray-400 mt-1">En prueba</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-red-100 text-center">
          <p class="text-2xl font-bold text-red-500">${stats.suspendidos}</p>
          <p class="text-xs text-gray-400 mt-1">Suspendidos</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <p class="text-2xl font-bold text-gray-400">${stats.cancelados}</p>
          <p class="text-xs text-gray-400 mt-1">Cancelados</p>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">Suscripciones</h3>
          <div class="flex gap-2">
            <select id="filter-estado" class="form-input text-sm py-1.5 px-3">
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="trial">Trial</option>
              <option value="suspendido">Suspendido</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50">
                <th class="text-left px-4 py-3 font-medium text-gray-500">SalÃ³n</th>
                <th class="text-left px-4 py-3 font-medium text-gray-500">Plan</th>
                <th class="text-left px-4 py-3 font-medium text-gray-500">Estado</th>
                <th class="text-left px-4 py-3 font-medium text-gray-500">Inicio</th>
                <th class="text-left px-4 py-3 font-medium text-gray-500">Fin</th>
                <th class="text-right px-4 py-3 font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody id="subs-table-body">
              ${(suscripciones || []).map(s => renderSubRow(s)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  // Filter
  document.getElementById('filter-estado')?.addEventListener('change', (e) => {
    const val = e.target.value;
    document.querySelectorAll('.sub-row').forEach(row => {
      row.style.display = (!val || row.dataset.estado === val) ? '' : 'none';
    });
  });

  // Actions
  content.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const subId = btn.dataset.subId;
    const userId = btn.dataset.userId;

    if (action === 'edit-sub') {
      await openEditSubModal(subId, planes);
    } else if (action === 'change-status') {
      const newStatus = btn.dataset.newStatus;
      const { error } = await supabase.from('suscripciones').update({ estado: newStatus, updated_at: new Date().toISOString() }).eq('id', subId);
      if (error) {
        showToast('Error: ' + error.message, 'error');
        return;
      }
      showToast('Estado actualizado');
      renderAdminSuscripciones();
    }
  });
}

function renderSubRow(sub) {
  const estadoColors = {
    activo: 'bg-green-50 text-green-700 border-green-200',
    trial: 'bg-blue-50 text-blue-700 border-blue-200',
    suspendido: 'bg-red-50 text-red-700 border-red-200',
    cancelado: 'bg-gray-50 text-gray-500 border-gray-200',
  };

  return `
    <tr class="sub-row border-b border-gray-50 hover:bg-gray-50/50" data-estado="${sub.estado}">
      <td class="px-4 py-3">
        <p class="font-medium text-gray-900">${sub.perfil?.nombre_salon || 'Sin nombre'}</p>
        <p class="text-xs text-gray-400">${sub.user_id.slice(0,8)}...</p>
      </td>
      <td class="px-4 py-3">
        <span class="text-sm font-medium text-terracota-600">${sub.plan?.nombre || 'Sin plan'}</span>
        ${sub.plan?.precio_mensual > 0 ? `<span class="text-xs text-gray-400"> $${sub.plan.precio_mensual}</span>` : ''}
      </td>
      <td class="px-4 py-3">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${estadoColors[sub.estado] || ''}">${sub.estado}</span>
      </td>
      <td class="px-4 py-3 text-sm text-gray-500">${sub.fecha_inicio ? new Date(sub.fecha_inicio).toLocaleDateString('es-MX') : 'â€”'}</td>
      <td class="px-4 py-3 text-sm text-gray-500">${sub.fecha_fin ? new Date(sub.fecha_fin).toLocaleDateString('es-MX') : 'â€”'}</td>
      <td class="px-4 py-3 text-right">
        <div class="flex items-center justify-end gap-1">
          <button data-action="edit-sub" data-sub-id="${sub.id}" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Editar">
            <i data-lucide="pencil" class="w-4 h-4"></i>
          </button>
          ${sub.estado !== 'activo' ? `<button data-action="change-status" data-sub-id="${sub.id}" data-new-status="activo" class="p-1.5 rounded-lg hover:bg-green-50 text-green-500" title="Activar"><i data-lucide="play" class="w-4 h-4"></i></button>` : ''}
          ${sub.estado === 'activo' ? `<button data-action="change-status" data-sub-id="${sub.id}" data-new-status="suspendido" class="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Suspender"><i data-lucide="pause" class="w-4 h-4"></i></button>` : ''}
          ${sub.estado !== 'cancelado' ? `<button data-action="change-status" data-sub-id="${sub.id}" data-new-status="cancelado" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" title="Cancelar"><i data-lucide="x-circle" class="w-4 h-4"></i></button>` : ''}
        </div>
      </td>
    </tr>
  `;
}

async function openEditSubModal(subId, planes) {
  const { data: sub } = await supabase.from('suscripciones').select('*').eq('id', subId).maybeSingle();
  if (!sub) return;

  const content = document.getElementById('modal-content');
  content.innerHTML = `
    <div class="p-6">
      <h3 class="font-display text-lg font-bold text-gray-900 mb-4">Editar SuscripciÃ³n</h3>
      <form id="sub-form" class="space-y-4">
        <div>
          <label class="form-label">Plan</label>
          <select id="sub-plan" class="form-input">
            ${(planes || []).map(p => `<option value="${p.id}" ${sub.plan_id === p.id ? 'selected' : ''}>${p.nombre} â€” $${p.precio_mensual}/mes</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="form-label">Estado</label>
          <select id="sub-estado" class="form-input">
            <option value="trial" ${sub.estado === 'trial' ? 'selected' : ''}>Trial</option>
            <option value="activo" ${sub.estado === 'activo' ? 'selected' : ''}>Activo</option>
            <option value="suspendido" ${sub.estado === 'suspendido' ? 'selected' : ''}>Suspendido</option>
            <option value="cancelado" ${sub.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Fecha inicio</label>
            <input type="date" id="sub-fecha-inicio" value="${sub.fecha_inicio || ''}" class="form-input">
          </div>
          <div>
            <label class="form-label">Fecha fin</label>
            <input type="date" id="sub-fecha-fin" value="${sub.fecha_fin || ''}" class="form-input">
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="submit" class="btn btn-primary flex-1 justify-center text-sm">Guardar</button>
          <button type="button" id="close-modal" class="btn btn-ghost flex-1 justify-center text-sm">Cancelar</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('modal-overlay').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();

  document.getElementById('close-modal')?.addEventListener('click', () => {
    document.getElementById('modal-overlay').classList.add('hidden');
  });

  document.getElementById('sub-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await supabase.from('suscripciones').update({
      plan_id: document.getElementById('sub-plan').value,
      estado: document.getElementById('sub-estado').value,
      fecha_inicio: document.getElementById('sub-fecha-inicio').value || null,
      fecha_fin: document.getElementById('sub-fecha-fin').value || null,
      updated_at: new Date().toISOString(),
    }).eq('id', subId);

    document.getElementById('modal-overlay').classList.add('hidden');
    renderAdminSuscripciones();
  });
}


