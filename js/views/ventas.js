// ============================================================
// NailDesk â€” Ventas View
// ============================================================

import supabase from '../supabase.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { exportWithHeaders } from '../utils/export-excel.js';

export async function renderVentas() {
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="flex items-center justify-center py-20"><div class="spinner"></div></div>`;

  const { data: ventas } = await supabase.from('ventas').select('*').order('fecha', { ascending: false }).limit(50);
  const { data: servicios } = await supabase.from('servicios').select('id, nombre, precio_redondeado, costo_total').eq('activo', true);

  const totalVentas = ventas?.reduce((s, v) => s + (Number(v.precio_cobrado) || 0), 0) || 0;
  const totalGanancia = ventas?.reduce((s, v) => s + (Number(v.ganancia) || 0), 0) || 0;

  container.innerHTML = `
    <div class="section-header animate-in">
      <div class="stat-row">
        <p class="text-sm" style="color:var(--terracota-400)">${ventas?.length || 0} ventas</p>
        <div class="section-divider"></div>
        <p class="text-sm" style="color:var(--terracota-300)">Total: <span class="font-semibold" style="color:var(--olive-500)">$${totalVentas.toLocaleString('es-MX')}</span></p>
        <div class="section-divider"></div>
        <p class="text-sm" style="color:var(--terracota-300)">Ganancia: <span class="font-semibold" style="color:var(--terracota-500)">$${totalGanancia.toLocaleString('es-MX')}</span></p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" id="btn-export-ventas"><i data-lucide="download" class="w-4 h-4"></i> Excel</button>
        <button class="btn btn-primary" id="btn-add-venta"><i data-lucide="plus" class="w-4 h-4"></i> Nueva Venta</button>
      </div>
    </div>

    <div class="card overflow-hidden animate-in-delay-1">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr><th>Fecha</th><th>Cliente</th><th>Servicio</th><th>Cobrado</th><th>Ganancia</th><th>MÃ©todo</th><th></th></tr>
          </thead>
          <tbody>
            ${ventas?.map(v => `
              <tr>
                <td style="color:var(--terracota-400)">${new Date(v.fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</td>
                <td class="font-medium" style="color:var(--charcoal)">${v.cliente_nombre || 'Sin nombre'}</td>
                <td>${v.servicio_nombre || '-'}</td>
                <td class="font-bold" style="color:var(--charcoal)">$${Number(v.precio_cobrado).toLocaleString('es-MX')}</td>
                <td class="font-semibold ${Number(v.ganancia) >= 0 ? 'text-green-700' : 'text-red-600'}">$${Number(v.ganancia).toLocaleString('es-MX')}</td>
                <td><span class="badge badge-info">${v.metodo_pago}</span></td>
                <td><button class="btn btn-ghost btn-delete-venta" data-id="${v.id}" style="padding:0.375rem"><i data-lucide="trash-2" class="w-4 h-4" style="color:#dc6b4a"></i></button></td>
              </tr>
            `).join('') || `
              <tr><td colspan="7" class="text-center py-12"><div class="empty-state"><i data-lucide="shopping-cart" class="w-12 h-12 mx-auto mb-3"></i><p class="font-medium" style="color:var(--terracota-400)">No hay ventas</p></div></td></tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  document.getElementById('btn-add-venta').addEventListener('click', () => openVentaModal(servicios));

  document.getElementById('btn-export-ventas')?.addEventListener('click', () => {
    if (!ventas?.length) { showToast('No hay datos para exportar', 'error'); return; }
    exportWithHeaders(ventas, 'NailDesk-Ventas', {
      'Fecha': 'fecha',
      'Cliente': 'cliente_nombre',
      'Servicio': 'servicio_nombre',
      'Precio Cobrado': 'precio_cobrado',
      'Costo Estimado': 'costo_estimado',
      'Ganancia': 'ganancia',
      'Metodo Pago': 'metodo_pago',
      'Notas': 'notas'
    }, { widths: { 'Fecha': 12, 'Cliente': 20, 'Servicio': 20, 'Precio Cobrado': 15, 'Costo Estimado': 15, 'Ganancia': 12, 'Metodo Pago': 15, 'Notas': 25 } });
    showToast('Archivo Excel descargado');
  });

  container.querySelectorAll('.btn-delete-venta').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Â¿Eliminar esta venta?')) return;
      await supabase.from('ventas').delete().eq('id', btn.dataset.id);
      showToast('Venta eliminada'); renderVentas();
    });
  });
}

function openVentaModal(servicios) {
  const today = new Date().toISOString().split('T')[0];

  openModal(`
    <form id="venta-form" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div><label class="form-label">Fecha</label><input type="date" id="v-fecha" class="form-input" value="${today}" required></div>
        <div><label class="form-label">Cliente</label><input type="text" id="v-cliente" class="form-input" placeholder="Nombre"></div>
      </div>
      <div>
        <label class="form-label">Servicio</label>
        <select id="v-servicio" class="form-input">
          <option value="">Seleccionar...</option>
          ${servicios?.map(s => `<option value="${s.id}" data-precio="${s.precio_redondeado}" data-costo="${s.costo_total}">${s.nombre} â€” $${Number(s.precio_redondeado).toLocaleString('es-MX')}</option>`).join('')}
        </select>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div><label class="form-label">Precio sugerido</label><input type="number" step="0.01" id="v-precio-sug" class="form-input" value="0" readonly></div>
        <div><label class="form-label">Precio cobrado</label><input type="number" step="0.01" id="v-precio-cobrado" class="form-input" value="0" required></div>
      </div>
      <div>
        <label class="form-label">Costo estimado</label>
        <input type="number" step="0.01" id="v-costo" class="form-input" value="0">
      </div>
      <div>
        <label class="form-label">MÃ©todo de pago</label>
        <select id="v-metodo" class="form-input">
          <option value="Efectivo">Efectivo</option>
          <option value="Tarjeta">Tarjeta</option>
          <option value="Transferencia">Transferencia</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
      <div><label class="form-label">Notas</label><textarea id="v-notas" class="form-input" rows="2" placeholder="Opcional"></textarea></div>
      <div class="flex gap-3 pt-2">
        <button type="button" class="btn btn-secondary flex-1" onclick="document.getElementById('modal-close-btn').click()">Cancelar</button>
        <button type="submit" class="btn btn-primary flex-1">Registrar</button>
      </div>
    </form>
  `, { title: 'Nueva Venta' });

  document.getElementById('v-servicio').addEventListener('change', (e) => {
    const opt = e.target.selectedOptions[0];
    document.getElementById('v-precio-sug').value = opt?.dataset?.precio || 0;
    document.getElementById('v-precio-cobrado').value = opt?.dataset?.precio || 0;
    document.getElementById('v-costo').value = opt?.dataset?.costo || 0;
  });

  document.getElementById('venta-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const sel = document.getElementById('v-servicio');
    const opt = sel.selectedOptions[0];
    const data = {
      fecha: document.getElementById('v-fecha').value,
      cliente_nombre: document.getElementById('v-cliente').value || null,
      servicio_id: sel.value || null,
      servicio_nombre: opt?.textContent?.split(' â€” ')[0] || null,
      precio_sugerido: Number(document.getElementById('v-precio-sug').value),
      precio_cobrado: Number(document.getElementById('v-precio-cobrado').value),
      costo_estimado: Number(document.getElementById('v-costo').value),
      metodo_pago: document.getElementById('v-metodo').value,
      notas: document.getElementById('v-notas').value || null,
    };
    await supabase.from('ventas').insert(data);
    showToast('Venta registrada'); closeModal(); renderVentas();
  });
}

