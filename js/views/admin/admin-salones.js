// ============================================================
// NailDesk — Admin: Gestión de Salones
// ============================================================

import supabase from '../../supabase.js';
import { openModal, closeModal } from '../../components/modal.js';
import { showToast } from '../../components/toast.js';

export async function renderAdminSalones() {
  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-terracota-500"></div></div>`;

  // Fetch salones with separate queries (no FK between perfiles_negocio and suscripciones)
  const [perfilesRes, subsRes] = await Promise.all([
    supabase.from('perfiles_negocio').select('user_id, nombre_salon, created_at').order('created_at', { ascending: false }),
    supabase.from('suscripciones').select('user_id, estado, plan:planes_suscripcion (nombre, slug, precio_mensual)'),
  ]);

  const perfiles = perfilesRes.data || [];
  const subs = subsRes.data || [];
  const subMap = {};
  subs.forEach(s => { subMap[s.user_id] = s; });

  const salones = perfiles.map(p => ({
    ...p,
    suscripciones: subMap[p.user_id] ? [subMap[p.user_id]] : [],
  }));

  if (perfilesRes.error || subsRes.error) {
    content.innerHTML = `<div class="p-8 text-center text-red-500">Error al cargar salones: ${(perfilesRes.error || subsRes.error)?.message}</div>`;
    return;
  }

  content.innerHTML = `
    <div class="space-y-6">
      <!-- Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-4 border border-gray-100">
          <p class="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Salones</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">${salones.length}</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100">
          <p class="text-xs text-gray-400 font-medium uppercase tracking-wide">Activos</p>
          <p class="text-2xl font-bold text-green-600 mt-1">${salones.filter(s => !['suspendido','cancelado'].includes(s.suscripciones?.[0]?.estado)).length}</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100">
          <p class="text-xs text-gray-400 font-medium uppercase tracking-wide">Suspendidos</p>
          <p class="text-2xl font-bold text-red-500 mt-1">${salones.filter(s => ['suspendido','cancelado'].includes(s.suscripciones?.[0]?.estado)).length}</p>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">Todos los Salones</h3>
          <input type="text" id="search-salones" placeholder="Buscar..." class="form-input text-sm py-1.5 px-3 w-64">
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50">
                <th class="text-left px-4 py-3 font-medium text-gray-500">Salón</th>
                <th class="text-left px-4 py-3 font-medium text-gray-500">Plan</th>
                <th class="text-left px-4 py-3 font-medium text-gray-500">Estado</th>
                <th class="text-left px-4 py-3 font-medium text-gray-500">Registro</th>
                <th class="text-right px-4 py-3 font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody id="salones-table-body">
              ${salones.map(s => renderSalonRow(s)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Search
  document.getElementById('search-salones')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('.salon-row');
    rows.forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  // Action handlers
  content.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const userId = btn.dataset.userId;

    if (action === 'toggle-suspend') {
      await toggleSuspension(userId);
    } else if (action === 'change-plan') {
      await promptChangePlan(userId);
    } else if (action === 'view-details') {
      await showSalonDetails(userId);
    }
  });

  if (window.lucide) lucide.createIcons();
}

function renderSalonRow(salon) {
  const sub = salon.suscripciones?.[0];
  const plan = sub?.plan;
  const estado = sub?.estado || 'sin_plan';
  const estadoColors = {
    activo: 'bg-green-50 text-green-700 border-green-200',
    trial: 'bg-blue-50 text-blue-700 border-blue-200',
    suspendido: 'bg-red-50 text-red-700 border-red-200',
    cancelado: 'bg-gray-50 text-gray-500 border-gray-200',
    sin_plan: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  };
  const isSuspended = ['suspendido', 'cancelado'].includes(estado);

  return `
    <tr class="salon-row border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td class="px-4 py-3">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-terracota-100 flex items-center justify-center flex-shrink-0">
            <i data-lucide="building-2" class="w-4 h-4 text-terracota-600"></i>
          </div>
          <div>
            <p class="font-medium text-gray-900">${salon.nombre_salon || 'Sin nombre'}</p>
            <p class="text-xs text-gray-400 truncate max-w-[200px]">${salon.user_id.slice(0,8)}...</p>
          </div>
        </div>
      </td>
      <td class="px-4 py-3">
        <span class="text-sm text-gray-600">${plan?.nombre || 'Sin plan'}</span>
        ${plan?.precio_mensual > 0 ? `<span class="text-xs text-gray-400 ml-1">$${plan.precio_mensual}/mes</span>` : ''}
      </td>
      <td class="px-4 py-3">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${estadoColors[estado] || estadoColors.sin_plan}">
          ${estado}
        </span>
      </td>
      <td class="px-4 py-3 text-gray-500 text-sm">${new Date(salon.created_at).toLocaleDateString('es-MX')}</td>
      <td class="px-4 py-3 text-right">
        <div class="flex items-center justify-end gap-1">
          <button data-action="view-details" data-user-id="${salon.user_id}" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Ver detalle">
            <i data-lucide="eye" class="w-4 h-4"></i>
          </button>
          <button data-action="change-plan" data-user-id="${salon.user_id}" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Cambiar plan">
            <i data-lucide="repeat" class="w-4 h-4"></i>
          </button>
          <button data-action="toggle-suspend" data-user-id="${salon.user_id}" class="p-1.5 rounded-lg hover:bg-gray-100 ${isSuspended ? 'text-green-500 hover:text-green-700' : 'text-red-400 hover:text-red-600'}" title="${isSuspended ? 'Reactivar' : 'Suspender'}">
            <i data-lucide="${isSuspended ? 'play' : 'pause'}" class="w-4 h-4"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
}

async function toggleSuspension(userId) {
  const { data: sub } = await supabase
    .from('suscripciones')
    .select('estado')
    .eq('user_id', userId)
    .maybeSingle();

  if (!sub) return;

  const newEstado = ['suspendido', 'cancelado'].includes(sub.estado) ? 'activo' : 'suspendido';
  await supabase
    .from('suscripciones')
    .update({ estado: newEstado, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  renderAdminSalones();
  showToast(newEstado === 'suspendido' ? 'Salón suspendido' : 'Salón reactivado');
}

async function promptChangePlan(userId) {
  const { data: planes } = await supabase
    .from('planes_suscripcion')
    .select('*')
    .eq('activo', true)
    .order('precio_mensual');

  const { data: current } = await supabase
    .from('suscripciones')
    .select('plan_id')
    .eq('user_id', userId)
    .maybeSingle();

  openModal(`
    <div class="space-y-3">
      ${planes.map(p => `
        <button data-plan-id="${p.id}" class="change-plan-btn w-full text-left p-4 rounded-xl border-2 transition-all ${current?.plan_id === p.id ? 'border-terracota-500 bg-terracota-50' : 'border-gray-200 hover:border-gray-300'}">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold text-gray-900">${p.nombre}</p>
              <p class="text-sm text-gray-500">${p.descripcion || ''}</p>
            </div>
            <p class="font-bold text-terracota-600">${p.precio_mensual > 0 ? '$' + p.precio_mensual + '/mes' : 'Gratis'}</p>
          </div>
        </button>
      `).join('')}
    </div>
  `, { title: 'Cambiar Plan' });

  document.querySelectorAll('.change-plan-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const planId = btn.dataset.planId;
      const { error } = await supabase
        .from('suscripciones')
        .upsert({
          user_id: userId,
          plan_id: planId,
          estado: 'activo',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      if (error) {
        showToast('Error: ' + error.message);
        return;
      }
      closeModal();
      renderAdminSalones();
      showToast('Plan actualizado');
    });
  });
}

async function showSalonDetails(userId) {
  const { data: perfil } = await supabase.from('perfiles_negocio').select('*').eq('user_id', userId).maybeSingle();
  const { data: sub } = await supabase.from('suscripciones').select('*, plan:planes_suscripcion(*)').eq('user_id', userId).maybeSingle();
  const { count: ventas } = await supabase.from('ventas').select('*', { count: 'exact', head: true }).eq('user_id', userId);
  const { count: servicios } = await supabase.from('servicios').select('*', { count: 'exact', head: true }).eq('user_id', userId);
  const { count: insumos } = await supabase.from('insumos').select('*', { count: 'exact', head: true }).eq('user_id', userId);

  openModal(`
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-50 rounded-xl p-4 text-center">
          <p class="text-2xl font-bold text-terracota-600">${ventas || 0}</p>
          <p class="text-xs text-gray-500 mt-1">Ventas registradas</p>
        </div>
        <div class="bg-gray-50 rounded-xl p-4 text-center">
          <p class="text-2xl font-bold text-terracota-600">${servicios || 0}</p>
          <p class="text-xs text-gray-500 mt-1">Servicios</p>
        </div>
        <div class="bg-gray-50 rounded-xl p-4 text-center">
          <p class="text-2xl font-bold text-terracota-600">${insumos || 0}</p>
          <p class="text-xs text-gray-500 mt-1">Insumos</p>
        </div>
        <div class="bg-gray-50 rounded-xl p-4 text-center">
          <p class="text-2xl font-bold text-terracota-600">${sub?.plan?.nombre || 'N/A'}</p>
          <p class="text-xs text-gray-500 mt-1">Plan actual</p>
        </div>
      </div>
      <div class="text-sm text-gray-500 space-y-1">
        <p><span class="font-medium text-gray-700">User ID:</span> ${userId}</p>
        <p><span class="font-medium text-gray-700">Registro:</span> ${perfil?.created_at ? new Date(perfil.created_at).toLocaleDateString('es-MX') : 'N/A'}</p>
      </div>
    </div>
  `, { title: perfil?.nombre_salon || 'Detalle del Salon' });
}


