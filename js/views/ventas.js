// ============================================================
// NailDesk — Ventas View (mejorado: filtros, gráficas, KPIs, editar)
// ============================================================

import supabase from '../supabase.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { exportWithHeaders } from '../utils/export-excel.js';
import { escapeHtml } from '../utils/escape-html.js';

let allVentas = [];
let allServicios = [];
let currentFilters = { periodo: 'mes', servicioId: '', metodo: '', fechaDesde: '', fechaHasta: '' };
let _ventasChart = null;
let _topServChart = null;

const PERIODOS = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'semana', label: 'Esta Semana' },
  { key: 'mes', label: 'Este Mes' },
  { key: 'anio', label: 'Este Año' },
  { key: 'todo', label: 'Todo' },
  { key: 'rango', label: 'Rango' },
];

function getDateRange(periodo) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  let desde = null;

  switch (periodo) {
    case 'hoy':
      desde = today;
      break;
    case 'semana': {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      desde = d.toISOString().split('T')[0];
      break;
    }
    case 'mes': {
      desde = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      break;
    }
    case 'anio': {
      desde = `${now.getFullYear()}-01-01`;
      break;
    }
    case 'todo':
    case 'rango':
    default:
      desde = null;
  }
  return { desde, hasta: today };
}

function filterVentas() {
  let filtered = [...allVentas];
  const { periodo, servicioId, metodo, fechaDesde, fechaHasta } = currentFilters;

  if (periodo === 'rango' && fechaDesde) {
    filtered = filtered.filter(v => v.fecha >= fechaDesde);
  } else if (periodo !== 'todo') {
    const { desde } = getDateRange(periodo);
    if (desde) filtered = filtered.filter(v => v.fecha >= desde);
  }
  if (periodo !== 'rango') {
    const { hasta } = getDateRange(periodo);
    filtered = filtered.filter(v => v.fecha <= hasta);
  }

  if (servicioId) filtered = filtered.filter(v => v.servicio_id === servicioId);
  if (metodo) filtered = filtered.filter(v => v.metodo_pago === metodo);

  return filtered;
}

function computeKPIs(ventas) {
  const total = ventas.length;
  const ingresos = ventas.reduce((s, v) => s + (Number(v.precio_cobrado) || 0), 0);
  const ganancia = ventas.reduce((s, v) => s + (Number(v.ganancia) || 0), 0);
  const ticket = total > 0 ? ingresos / total : 0;
  const margen = ingresos > 0 ? ((ganancia / ingresos) * 100).toFixed(1) : '0.0';
  return { total, ingresos, ganancia, ticket, margen };
}

function groupByPeriod(ventas) {
  const map = {};
  ventas.forEach(v => {
    const d = new Date(v.fecha + 'T00:00:00');
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map[key]) map[key] = 0;
    map[key] += Number(v.precio_cobrado) || 0;
  });
  return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
}

function getTopServicios(ventas, limit = 5) {
  const map = {};
  ventas.forEach(v => {
    const name = v.servicio_nombre || 'Sin servicio';
    if (!map[name]) map[name] = { count: 0, ingresos: 0 };
    map[name].count++;
    map[name].ingresos += Number(v.precio_cobrado) || 0;
  });
  return Object.entries(map)
    .map(([nombre, data]) => ({ nombre, ...data }))
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, limit);
}

export async function renderVentas() {
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="flex items-center justify-center py-20"><div class="spinner"></div></div>`;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const [ventasRes, serviciosRes, extrasRes] = await Promise.all([
    supabase.from('ventas').select('*').eq('user_id', user.id).order('fecha', { ascending: false }),
    supabase.from('servicios').select('id, nombre, precio_redondeado, costo_total').eq('user_id', user.id).eq('activo', true),
    supabase.from('venta_extras').select('*, extra:extras(nombre, precio_redondeado)').eq('user_id', user.id),
  ]);

  allVentas = ventasRes.data || [];
  allServicios = serviciosRes.data || [];
  const ventaExtrasMap = {};
  (extrasRes.data || []).forEach(ve => {
    if (!ventaExtrasMap[ve.venta_id]) ventaExtrasMap[ve.venta_id] = [];
    ventaExtrasMap[ve.venta_id].push(ve);
  });

  const filtered = filterVentas();
  const kpis = computeKPIs(filtered);
  const topServ = getTopServicios(filtered);
  const byPeriod = groupByPeriod(filtered);

  const uniqueMetodos = [...new Set(allVentas.map(v => v.metodo_pago).filter(Boolean))];

  container.innerHTML = `
    <div class="space-y-6 animate-in">

      <!-- KPIs -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div class="bg-white rounded-xl p-4 border border-gray-100">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center"><i data-lucide="hash" class="w-4 h-4 text-gray-500"></i></div>
            <span class="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Ventas</span>
          </div>
          <p class="text-2xl font-bold text-gray-900">${kpis.total}</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center"><i data-lucide="dollar-sign" class="w-4 h-4 text-green-600"></i></div>
            <span class="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Ingresos</span>
          </div>
          <p class="text-2xl font-bold text-green-700">$${kpis.ingresos.toLocaleString('es-MX')}</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center"><i data-lucide="trending-up" class="w-4 h-4 text-purple-600"></i></div>
            <span class="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Ganancia</span>
          </div>
          <p class="text-2xl font-bold ${kpis.ganancia >= 0 ? 'text-green-700' : 'text-red-600'}">$${kpis.ganancia.toLocaleString('es-MX')}</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><i data-lucide="receipt" class="w-4 h-4 text-blue-600"></i></div>
            <span class="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Ticket Prom.</span>
          </div>
          <p class="text-2xl font-bold text-gray-900">$${kpis.ticket.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><i data-lucide="percent" class="w-4 h-4 text-amber-600"></i></div>
            <span class="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Margen</span>
          </div>
          <p class="text-2xl font-bold text-gray-900">${kpis.margen}%</p>
        </div>
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-xl p-4 border border-gray-100">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            ${PERIODOS.map(p => `
              <button class="filter-periodo px-3 py-1.5 text-xs font-medium rounded-md transition-all ${currentFilters.periodo === p.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}" data-periodo="${p.key}">${p.label}</button>
            `).join('')}
          </div>
          ${currentFilters.periodo === 'rango' ? `
            <input type="date" id="filter-fecha-desde" class="form-input text-xs py-1.5 px-2 w-32" value="${currentFilters.fechaDesde}">
            <span class="text-gray-400 text-xs">a</span>
            <input type="date" id="filter-fecha-hasta" class="form-input text-xs py-1.5 px-2 w-32" value="${currentFilters.fechaHasta}">
          ` : ''}
          <select id="filter-servicio" class="form-input text-xs py-1.5 px-2 w-44">
            <option value="">Todos los servicios</option>
            ${allServicios.map(s => `<option value="${s.id}" ${currentFilters.servicioId === s.id ? 'selected' : ''}>${s.nombre}</option>`).join('')}
          </select>
          <select id="filter-metodo" class="form-input text-xs py-1.5 px-2 w-36">
            <option value="">Todos los métodos</option>
            ${uniqueMetodos.map(m => `<option value="${m}" ${currentFilters.metodo === m ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Gráficas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <h4 class="font-semibold text-gray-900 mb-4">Ingresos por Período</h4>
          <div style="height:250px"><canvas id="chart-ventas-periodo"></canvas></div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <h4 class="font-semibold text-gray-900 mb-4">Top 5 Servicios</h4>
          <div style="height:250px"><canvas id="chart-top-servicios"></canvas></div>
        </div>
      </div>

      <!-- Acciones -->
      <div class="flex justify-between items-center">
        <p class="text-sm text-gray-400">${filtered.length} ventas${filtered.length !== allVentas.length ? ` de ${allVentas.length} totales` : ''}</p>
        <div class="flex gap-2">
          <button class="btn btn-secondary" id="btn-export-ventas"><i data-lucide="download" class="w-4 h-4"></i> Excel</button>
          <button class="btn btn-primary" id="btn-add-venta"><i data-lucide="plus" class="w-4 h-4"></i> Nueva Venta</button>
        </div>
      </div>

      <!-- Tabla -->
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50">
                <th class="text-left px-4 py-3 font-medium text-gray-500">Fecha</th>
                <th class="text-left px-4 py-3 font-medium text-gray-500">Cliente</th>
                <th class="text-left px-4 py-3 font-medium text-gray-500">Servicio</th>
                <th class="text-right px-4 py-3 font-medium text-gray-500">Cobrado</th>
                <th class="text-right px-4 py-3 font-medium text-gray-500">Ganancia</th>
                <th class="text-center px-4 py-3 font-medium text-gray-500">Método</th>
                <th class="text-center px-4 py-3 font-medium text-gray-500">Extras</th>
                <th class="text-center px-4 py-3 font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(v => {
                const extras = ventaExtrasMap[v.id];
                const extrasCount = extras?.length || 0;
                return `
                <tr class="border-b border-gray-50 hover:bg-gray-50/50">
                  <td class="px-4 py-3 text-gray-500">${new Date(v.fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                   <td class="px-4 py-3 font-medium text-gray-900">${escapeHtml(v.cliente_nombre) || 'Sin nombre'}</td>
                  <td class="px-4 py-3 text-gray-600">${escapeHtml(v.servicio_nombre) || '-'}</td>
                  <td class="px-4 py-3 text-right font-bold text-gray-900">$${Number(v.precio_cobrado).toLocaleString('es-MX')}</td>
                  <td class="px-4 py-3 text-right font-semibold ${Number(v.ganancia) >= 0 ? 'text-green-700' : 'text-red-600'}">$${Number(v.ganancia).toLocaleString('es-MX')}</td>
                  <td class="px-4 py-3 text-center"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">${v.metodo_pago}</span></td>
                  <td class="px-4 py-3 text-center">${extrasCount > 0 ? `<button class="btn-edit-venta-extras text-xs text-purple-600 hover:text-purple-800 font-medium" data-id="${v.id}">${extrasCount} extra(s)</button>` : '<span class="text-gray-300">—</span>'}</td>
                  <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <button class="btn-edit-venta p-1.5 rounded-lg hover:bg-gray-100 transition-colors" data-id="${v.id}"><i data-lucide="pencil" class="w-3.5 h-3.5 text-gray-400"></i></button>
                      <button class="btn-delete-venta p-1.5 rounded-lg hover:bg-red-50 transition-colors" data-id="${v.id}"><i data-lucide="trash-2" class="w-3.5 h-3.5 text-red-400"></i></button>
                    </div>
                  </td>
                </tr>`;
              }).join('') || `
                <tr><td colspan="8" class="text-center py-12 text-gray-400">
                  <i data-lucide="shopping-cart" class="w-12 h-12 mx-auto mb-3 text-gray-300"></i>
                  <p class="font-medium">No hay ventas para los filtros seleccionados</p>
                </td></tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  renderVentasChart(byPeriod);
  renderTopServiciosChart(topServ);
  bindFilterEvents(ventaExtrasMap);

  document.getElementById('btn-add-venta').addEventListener('click', () => openVentaModal(null, user));
  document.getElementById('btn-export-ventas')?.addEventListener('click', () => {
    if (!filtered.length) { showToast('No hay datos para exportar', 'error'); return; }
    exportWithHeaders(filtered, 'NailDesk-Ventas', {
      'Fecha': 'fecha', 'Cliente': 'cliente_nombre', 'Servicio': 'servicio_nombre',
      'Precio Cobrado': 'precio_cobrado', 'Costo Estimado': 'costo_estimado', 'Ganancia': 'ganancia',
      'Metodo Pago': 'metodo_pago', 'Notas': 'notas'
    });
    showToast('Archivo Excel descargado');
  });

  container.querySelectorAll('.btn-delete-venta').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar esta venta?')) return;
      await supabase.from('venta_extras').delete().eq('venta_id', btn.dataset.id);
      await supabase.from('ventas').delete().eq('id', btn.dataset.id);
      showToast('Venta eliminada');
      renderVentas();
    });
  });

  container.querySelectorAll('.btn-edit-venta').forEach(btn => {
    btn.addEventListener('click', async () => {
      const venta = allVentas.find(v => v.id === btn.dataset.id);
      if (venta) openVentaModal(venta);
    });
  });

  container.querySelectorAll('.btn-edit-venta-extras').forEach(btn => {
    btn.addEventListener('click', () => {
      const extras = ventaExtrasMap[btn.dataset.id] || [];
      openExtrasModal(extras);
    });
  });
}

function bindFilterEvents() {
  document.querySelectorAll('.filter-periodo').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilters.periodo = btn.dataset.periodo;
      if (btn.dataset.periodo !== 'rango') {
        const { desde, hasta } = getDateRange(btn.dataset.periodo);
        currentFilters.fechaDesde = desde;
        currentFilters.fechaHasta = hasta;
      }
      renderVentas();
    });
  });

  const fechaDesde = document.getElementById('filter-fecha-desde');
  const fechaHasta = document.getElementById('filter-fecha-hasta');
  if (fechaDesde) fechaDesde.addEventListener('change', (e) => { currentFilters.fechaDesde = e.target.value; renderVentas(); });
  if (fechaHasta) fechaHasta.addEventListener('change', (e) => { currentFilters.fechaHasta = e.target.value; renderVentas(); });

  const filterServicio = document.getElementById('filter-servicio');
  const filterMetodo = document.getElementById('filter-metodo');
  if (filterServicio) filterServicio.addEventListener('change', (e) => { currentFilters.servicioId = e.target.value; renderVentas(); });
  if (filterMetodo) filterMetodo.addEventListener('change', (e) => { currentFilters.metodo = e.target.value; renderVentas(); });
}

function renderVentasChart(byPeriod) {
  const ctx = document.getElementById('chart-ventas-periodo');
  if (!ctx) return;
  if (_ventasChart) { _ventasChart.destroy(); _ventasChart = null; }

  const labels = byPeriod.map(([k]) => {
    const [y, m] = k.split('-');
    const d = new Date(y, m - 1);
    return d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
  });

  _ventasChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Ingresos ($)',
        data: byPeriod.map(([, v]) => v),
        backgroundColor: '#A0607A',
        borderRadius: 6,
        barThickness: 32,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => '$' + v.toLocaleString() } },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderTopServiciosChart(topServ) {
  const ctx = document.getElementById('chart-top-servicios');
  if (!ctx) return;
  if (_topServChart) { _topServChart.destroy(); _topServChart = null; }

  _topServChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: topServ.map(s => s.nombre.length > 18 ? s.nombre.slice(0, 16) + '...' : s.nombre),
      datasets: [{
        label: 'Ingresos ($)',
        data: topServ.map(s => s.ingresos),
        backgroundColor: ['#A0607A', '#8BA888', '#C994A1', '#D4AAB5', '#B8849A'],
        borderRadius: 6,
        barThickness: 28,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { callback: v => '$' + v.toLocaleString() }, grid: { display: false } },
        y: { grid: { display: false } }
      }
    }
  });
}

function openVentaModal(venta = null, user = null) {
  const isEdit = !!venta;
  const today = new Date().toISOString().split('T')[0];

  openModal(`
    <form id="venta-form" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div><label class="form-label">Fecha</label><input type="date" id="v-fecha" class="form-input" value="${venta?.fecha || today}" required></div>
        <div><label class="form-label">Cliente</label><input type="text" id="v-cliente" class="form-input" placeholder="Nombre" value="${escapeHtml(venta?.cliente_nombre) || ''}"></div>
      </div>
      <div>
        <label class="form-label">Servicio</label>
        <select id="v-servicio" class="form-input">
          <option value="">Seleccionar...</option>
          ${allServicios.map(s => `<option value="${s.id}" data-precio="${s.precio_redondeado}" data-costo="${s.costo_total}" ${venta?.servicio_id === s.id ? 'selected' : ''}>${escapeHtml(s.nombre)} — $${Number(s.precio_redondeado).toLocaleString('es-MX')}</option>`).join('')}
        </select>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div><label class="form-label">Precio sugerido</label><input type="number" step="0.01" id="v-precio-sug" class="form-input" value="${venta?.precio_sugerido || 0}" readonly></div>
        <div><label class="form-label">Precio cobrado</label><input type="number" step="0.01" id="v-precio-cobrado" class="form-input" value="${venta?.precio_cobrado || 0}" required></div>
      </div>
      <div><label class="form-label">Costo estimado</label><input type="number" step="0.01" id="v-costo" class="form-input" value="${venta?.costo_estimado || 0}"></div>
      <div>
        <label class="form-label">Método de pago</label>
        <select id="v-metodo" class="form-input">
          ${['Efectivo', 'Tarjeta', 'Transferencia', 'Otro'].map(m => `<option value="${m}" ${venta?.metodo_pago === m ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
      </div>
      <div><label class="form-label">Notas</label><textarea id="v-notas" class="form-input" rows="2" placeholder="Opcional">${escapeHtml(venta?.notas) || ''}</textarea></div>
      <div class="flex gap-3 pt-2">
        <button type="button" class="btn btn-secondary flex-1" onclick="document.getElementById('modal-close-btn').click()">Cancelar</button>
        <button type="submit" class="btn btn-primary flex-1">${isEdit ? 'Guardar Cambios' : 'Registrar'}</button>
      </div>
    </form>
  `, { title: isEdit ? 'Editar Venta' : 'Nueva Venta' });

  document.getElementById('v-servicio').addEventListener('change', (e) => {
    const opt = e.target.selectedOptions[0];
    document.getElementById('v-precio-sug').value = opt?.dataset?.precio || 0;
    if (!isEdit) {
      document.getElementById('v-precio-cobrado').value = opt?.dataset?.precio || 0;
    }
    document.getElementById('v-costo').value = opt?.dataset?.costo || 0;
  });

  document.getElementById('venta-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const sel = document.getElementById('v-servicio');
    const opt = sel.selectedOptions[0];
    const payload = {
      fecha: document.getElementById('v-fecha').value,
      cliente_nombre: document.getElementById('v-cliente').value || null,
      servicio_id: sel.value || null,
      servicio_nombre: opt?.textContent?.split(' — ')[0] || null,
      precio_sugerido: Number(document.getElementById('v-precio-sug').value),
      precio_cobrado: Number(document.getElementById('v-precio-cobrado').value),
      costo_estimado: Number(document.getElementById('v-costo').value),
      metodo_pago: document.getElementById('v-metodo').value,
      notas: document.getElementById('v-notas').value || null,
    };

    if (isEdit) {
      await supabase.from('ventas').update(payload).eq('id', venta.id);
      showToast('Venta actualizada');
    } else {
      await supabase.from('ventas').insert({ ...payload, user_id: user?.id });
      showToast('Venta registrada');
    }
    closeModal();
    renderVentas();
  });
}

function openExtrasModal(extras) {
  openModal(`
    <div class="space-y-2">
      ${extras.map(ve => `
        <div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
          <span class="text-sm text-gray-700">${escapeHtml(ve.extra?.nombre) || 'Extra'}</span>
          <span class="text-sm font-semibold text-gray-900">$${Number(ve.subtotal).toLocaleString('es-MX')} <span class="text-xs text-gray-400 font-normal">×${ve.cantidad}</span></span>
        </div>
      `).join('')}
      <div class="flex justify-between items-center pt-2 font-semibold">
        <span class="text-sm text-gray-900">Total extras</span>
        <span class="text-sm text-terracota-600">$${extras.reduce((s, ve) => s + Number(ve.subtotal), 0).toLocaleString('es-MX')}</span>
      </div>
    </div>
  `, { title: 'Extras de esta venta' });
}
