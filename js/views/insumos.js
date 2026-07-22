// ============================================================
// NailDesk — Insumos View
// ============================================================

import supabase from '../supabase.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { exportWithHeaders } from '../utils/export-excel.js';
import { escapeHtml } from '../utils/escape-html.js';

export async function renderInsumos() {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="skeleton skeleton-card" style="height:48px;margin-bottom:1.5rem"></div>
    <div class="skeleton skeleton-card" style="height:320px"></div>
  `;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: insumos } = await supabase.from('insumos').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

  container.innerHTML = `
    <div class="section-header animate-in">
      <div class="stat-row">
        <p class="text-sm" style="color:var(--terracota-400)">${insumos?.length || 0} insumos</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" id="btn-export-insumos"><i data-lucide="download" class="w-4 h-4"></i> Excel</button>
        <button class="btn btn-primary" id="btn-add-insumo">
        <i data-lucide="plus" class="w-4 h-4"></i> Nuevo Insumo
      </button>
    </div>

    <div class="card-elevated overflow-hidden animate-in stagger-1">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr><th>Producto</th><th>Presentación</th><th>Costo</th><th>Rendimiento</th><th>Costo/uso</th><th>Stock</th><th></th></tr>
          </thead>
          <tbody>
            ${insumos?.map(i => `
              <tr>
                <td class="font-semibold" style="color:var(--charcoal)">${escapeHtml(i.producto)}</td>
                <td style="color:var(--terracota-400)">${escapeHtml(i.presentacion) || '-'}</td>
                <td>$${Number(i.costo_compra).toFixed(2)}</td>
                <td><span class="badge badge-info">${i.rendimiento} usos</span></td>
                <td class="font-bold" style="color:var(--terracota-600)">$${Number(i.costo_por_uso).toFixed(2)}</td>
                <td><span class="badge ${i.stock_actual > 3 ? 'badge-success' : i.stock_actual > 0 ? 'badge-warning' : 'badge-danger'}">${i.stock_actual}</span></td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn btn-ghost btn-edit" data-id="${i.id}" style="padding:0.375rem"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                    <button class="btn btn-ghost btn-delete" data-id="${i.id}" style="padding:0.375rem"><i data-lucide="trash-2" class="w-4 h-4" style="color:#dc6b4a"></i></button>
                  </div>
                </td>
              </tr>
            `).join('') || `
              <tr><td colspan="7" class="text-center py-16">
                <div class="empty-state">
                  <div class="empty-state-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                  </div>
                  <h3>No hay insumos</h3>
                  <p>Agrega insumos para calcular costos de materiales.</p>
                </div>
              </td></tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  document.getElementById('btn-add-insumo').addEventListener('click', () => openInsumoModal(null, user));

  document.getElementById('btn-export-insumos')?.addEventListener('click', () => {
    if (!insumos?.length) { showToast('No hay datos para exportar', 'error'); return; }
    exportWithHeaders(insumos, 'NailDesk-Insumos', {
      'Producto': 'producto',
      'Presentacion': 'presentacion',
      'Costo Compra': 'costo_compra',
      'Rendimiento': 'rendimiento',
      'Costo por Uso': 'costo_por_uso',
      'Stock': 'stock_actual'
    }, { widths: { 'Producto': 20, 'Presentacion': 15, 'Costo Compra': 12, 'Rendimiento': 12, 'Costo por Uso': 12, 'Stock': 10 } });
    showToast('Archivo Excel descargado');
  });

  container.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = insumos.find(x => x.id === btn.dataset.id);
      if (item) openInsumoModal(item);
    });
  });

  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este insumo?')) return;
      await supabase.from('insumos').delete().eq('id', btn.dataset.id);
      showToast('Insumo eliminado');
      renderInsumos();
    });
  });
}

function openInsumoModal(item = null, user = null) {
  const isEdit = !!item;
  openModal(`
    <form id="insumo-form" class="space-y-4">
      <div><label class="form-label">Producto</label><input type="text" id="i-producto" class="form-input" value="${escapeHtml(item?.producto) || ''}" required placeholder="Ej: Polvo acrílico"></div>
      <div><label class="form-label">Presentación</label><input type="text" id="i-presentacion" class="form-input" value="${escapeHtml(item?.presentacion) || ''}" placeholder="Ej: 450 g"></div>
      <div class="grid grid-cols-2 gap-4">
        <div><label class="form-label">Costo de compra</label><input type="number" step="0.01" id="i-costo" class="form-input" value="${item?.costo_compra || 0}" required></div>
        <div><label class="form-label">Rendimiento (usos)</label><input type="number" id="i-rendimiento" class="form-input" value="${item?.rendimiento || 1}" required></div>
      </div>
      <div><label class="form-label">Stock actual</label><input type="number" step="0.01" id="i-stock" class="form-input" value="${item?.stock_actual || 0}"></div>
      <div class="flex gap-3 pt-2">
        <button type="button" class="btn btn-secondary flex-1" onclick="document.getElementById('modal-close-btn').click()">Cancelar</button>
        <button type="submit" class="btn btn-primary flex-1">${isEdit ? 'Guardar' : 'Crear'}</button>
      </div>
    </form>
  `, { title: isEdit ? 'Editar Insumo' : 'Nuevo Insumo' });

  document.getElementById('insumo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      producto: document.getElementById('i-producto').value,
      presentacion: document.getElementById('i-presentacion').value,
      costo_compra: Number(document.getElementById('i-costo').value),
      rendimiento: Number(document.getElementById('i-rendimiento').value),
      stock_actual: Number(document.getElementById('i-stock').value),
    };
    if (isEdit) { await supabase.from('insumos').update(data).eq('id', item.id); showToast('Insumo actualizado'); }
    else { await supabase.from('insumos').insert({ ...data, user_id: user?.id }); showToast('Insumo creado'); }
    closeModal(); renderInsumos();
  });
}
