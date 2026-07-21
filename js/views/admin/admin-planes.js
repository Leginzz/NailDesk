// ============================================================
// NailDesk — Admin: Planes de Suscripción
// ============================================================

import supabase from '../../supabase.js';
import { escapeHtml } from '../../utils/escape-html.js';

export async function renderAdminPlanes() {
  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-terracota-500"></div></div>`;

  const [planesRes, modulosRes] = await Promise.all([
    supabase.from('planes_suscripcion').select('*').order('precio_mensual'),
    supabase.from('modulos_sistema').select('*').eq('activo', true).order('orden'),
  ]);

  const planes = planesRes.data || [];
  const modulos = modulosRes.data || [];

  // Get plan-module mappings
  const { data: planModulos } = await supabase.from('plan_modulos').select('plan_id, modulo_id');
  const planModMap = {};
  (planModulos || []).forEach(pm => {
    if (!planModMap[pm.plan_id]) planModMap[pm.plan_id] = new Set();
    planModMap[pm.plan_id].add(pm.modulo_id);
  });

  content.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Planes de Suscripción</h3>
          <p class="text-sm text-gray-500 mt-1">Configura los planes y módulos incluidos en cada uno</p>
        </div>
        <button id="btn-new-plan" class="btn btn-primary text-sm px-4 py-2">
          <i data-lucide="plus" class="w-4 h-4 mr-1"></i>Nuevo Plan
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${planes.map(plan => renderPlanCard(plan, modulos, planModMap[plan.id] || new Set())).join('')}
      </div>

      <!-- Module Legend -->
      <div class="bg-white rounded-xl border border-gray-100 p-4">
        <h4 class="text-sm font-semibold text-gray-700 mb-3">Módulos del Sistema</h4>
        <div class="flex flex-wrap gap-2">
          ${modulos.map(m => `
            <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs text-gray-600">
              <i data-lucide="${m.icono}" class="w-3 h-3"></i>${escapeHtml(m.nombre)}
            </span>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  // New plan
  document.getElementById('btn-new-plan')?.addEventListener('click', () => openPlanModal(null, modulos));

  // Edit buttons
  content.querySelectorAll('[data-action="edit-plan"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = planes.find(p => p.id === btn.dataset.planId);
      openPlanModal(plan, modulos);
    });
  });

  // Toggle module buttons
  content.querySelectorAll('[data-action="toggle-module"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const planId = btn.dataset.planId;
      const moduloId = btn.dataset.moduloId;
      const exists = planModMap[planId]?.has(moduloId);

      if (exists) {
        await supabase.from('plan_modulos').delete().eq('plan_id', planId).eq('modulo_id', moduloId);
      } else {
        await supabase.from('plan_modulos').insert({ plan_id: planId, modulo_id: moduloId });
      }
      renderAdminPlanes();
    });
  });
}

function renderPlanCard(plan, modulos, includedModulos) {
  const isFree = plan.precio_mensual === 0;
  const subscriberCount = 0; // Could be fetched separately

  return `
    <div class="bg-white rounded-2xl border-2 ${isFree ? 'border-gray-200' : 'border-terracota-200'} overflow-hidden">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h4 class="font-display text-xl font-bold text-gray-900">${escapeHtml(plan.nombre)}</h4>
          <button data-action="edit-plan" data-plan-id="${plan.id}" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <i data-lucide="pencil" class="w-4 h-4"></i>
          </button>
        </div>
        <p class="text-3xl font-bold text-terracota-600 mb-1">${isFree ? 'Gratis' : '$' + plan.precio_mensual}<span class="text-sm font-normal text-gray-400">/mes</span></p>
        <p class="text-sm text-gray-500 mb-4">${escapeHtml(plan.descripcion) || 'Sin descripción'}</p>
        <div class="text-xs text-gray-400 mb-4">Slug: <code class="bg-gray-100 px-1 rounded">${escapeHtml(plan.slug)}</code></div>
      </div>
      <div class="border-t border-gray-100 p-4">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Módulos incluidos</p>
        <div class="space-y-1.5">
          ${modulos.map(m => {
            const included = includedModulos.has(m.id);
            return `
              <button data-action="toggle-module" data-plan-id="${plan.id}" data-modulo-id="${m.id}"
                class="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${included ? 'bg-terracota-50 text-terracota-700' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}">
                <span class="flex items-center gap-2">
                  <i data-lucide="${m.icono}" class="w-3.5 h-3.5"></i>${escapeHtml(m.nombre)}
                </span>
                <i data-lucide="${included ? 'check-circle' : 'circle'}" class="w-4 h-4 ${included ? 'text-terracota-500' : 'text-gray-300'}"></i>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

function openPlanModal(plan, modulos) {
  const content = document.getElementById('modal-content');
  const isNew = !plan;

  content.innerHTML = `
    <div class="p-6">
      <h3 class="font-display text-lg font-bold text-gray-900 mb-4">${isNew ? 'Nuevo Plan' : 'Editar Plan'}</h3>
      <form id="plan-form" class="space-y-4">
        <div>
          <label class="form-label">Nombre</label>
          <input type="text" id="plan-nombre" value="${escapeHtml(plan?.nombre) || ''}" required class="form-input" placeholder="Ej: Premium">
        </div>
        <div>
          <label class="form-label">Slug</label>
          <input type="text" id="plan-slug" value="${escapeHtml(plan?.slug) || ''}" required class="form-input" placeholder="premium" ${!isNew ? 'readonly' : ''}>
        </div>
        <div>
          <label class="form-label">Precio mensual ($)</label>
          <input type="number" id="plan-precio" value="${plan?.precio_mensual || 0}" min="0" step="0.01" class="form-input">
        </div>
        <div>
          <label class="form-label">Descripción</label>
          <input type="text" id="plan-descripcion" value="${escapeHtml(plan?.descripcion) || ''}" class="form-input" placeholder="Descripción del plan">
        </div>
        <div class="flex gap-3 pt-2">
          <button type="submit" class="btn btn-primary flex-1 justify-center text-sm">
            ${isNew ? 'Crear Plan' : 'Guardar Cambios'}
          </button>
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

  document.getElementById('plan-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      nombre: document.getElementById('plan-nombre').value.trim(),
      slug: document.getElementById('plan-slug').value.trim(),
      precio_mensual: parseFloat(document.getElementById('plan-precio').value) || 0,
      descripcion: document.getElementById('plan-descripcion').value.trim(),
    };

    if (isNew) {
      await supabase.from('planes_suscripcion').insert(data);
    } else {
      await supabase.from('planes_suscripcion').update(data).eq('id', plan.id);
    }

    document.getElementById('modal-overlay').classList.add('hidden');
    renderAdminPlanes();
  });
}
