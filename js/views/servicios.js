// ============================================================
// NailDesk — Servicios View (con gestión de insumos)
// ============================================================

import supabase from '../supabase.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { exportWithHeaders } from '../utils/export-excel.js';

let insumosCatalog = [];
let perfilData = null;
let costoFijoPorHora = 0;

export async function renderServicios() {
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="flex items-center justify-center py-20"><div class="spinner"></div></div>`;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const [servRes, insumosRes, siRes, perfilRes, resumenRes] = await Promise.all([
    supabase.from('servicios').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('insumos').select('*').eq('user_id', user.id).eq('activo', true).order('producto'),
    supabase.from('servicio_insumos').select('*').eq('user_id', user.id),
    supabase.from('perfiles_negocio').select('tarifa_mano_obra_hora, horas_trabajo_mes').eq('user_id', user.id).maybeSingle(),
    supabase.from('vista_resumen_negocio').select('costo_fijo_por_hora').eq('user_id', user.id).maybeSingle(),
  ]);

  insumosCatalog = insumosRes.data || [];
  perfilData = perfilRes.data;
  costoFijoPorHora = Number(resumenRes.data?.costo_fijo_por_hora || 0);

  const servicios = servRes.data || [];
  const servicioInsumos = siRes.data || [];

  const insumosCountMap = {};
  servicioInsumos.forEach(si => {
    insumosCountMap[si.servicio_id] = (insumosCountMap[si.servicio_id] || 0) + 1;
  });

  container.innerHTML = `
    <div class="section-header animate-in">
      <div class="stat-row">
        <p class="text-sm" style="color:var(--terracota-400)">${servicios?.length || 0} servicios</p>
        <div class="section-divider"></div>
        <p class="text-sm" style="color:var(--terracota-300)">${servicios?.filter(s => s.activo).length || 0} activos</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" id="btn-export-servicios"><i data-lucide="download" class="w-4 h-4"></i> Excel</button>
        <button class="btn btn-primary" id="btn-add-servicio">
        <i data-lucide="plus" class="w-4 h-4"></i> Nuevo Servicio
      </button>
    </div>

    <div class="card overflow-hidden animate-in-delay-1">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Insumos</th>
              <th>Tiempo</th>
              <th>Costo</th>
              <th>Ganancia</th>
              <th>Precio</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${servicios?.map(s => `
              <tr>
                <td>
                  <div>
                    <p class="font-semibold" style="color:var(--charcoal)">${s.nombre}</p>
                    ${s.descripcion ? `<p class="text-xs" style="color:var(--terracota-300)">${s.descripcion}</p>` : ''}
                  </div>
                </td>
                <td>
                  <span class="badge ${insumosCountMap[s.id] ? 'badge-info' : 'badge-warning'}">
                    ${insumosCountMap[s.id] || 0} insumo${(insumosCountMap[s.id] || 0) !== 1 ? 's' : ''}
                  </span>
                </td>
                <td><span class="badge badge-info">${s.tiempo_horas}h</span></td>
                <td style="color:var(--terracota-400)">$${Number(s.costo_total).toFixed(0)}</td>
                <td><span class="badge badge-success">${s.porcentaje_ganancia}%</span></td>
                <td class="font-bold" style="color:var(--terracota-600)">$${Number(s.precio_redondeado).toLocaleString('es-MX')}</td>
                <td><span class="badge ${s.activo ? 'badge-success' : 'badge-danger'}">${s.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn btn-ghost btn-edit" data-id="${s.id}" style="padding:0.375rem"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                    <button class="btn btn-ghost btn-delete" data-id="${s.id}" style="padding:0.375rem"><i data-lucide="trash-2" class="w-4 h-4" style="color:#dc6b4a"></i></button>
                  </div>
                </td>
              </tr>
            `).join('') || `
              <tr><td colspan="8" class="text-center py-12">
                <div class="empty-state">
                  <i data-lucide="scissors" class="w-12 h-12 mx-auto mb-3"></i>
                  <p class="font-medium" style="color:var(--terracota-400)">No hay servicios</p>
                  <p class="text-xs mt-1" style="color:var(--terracota-300)">Crea tu primer servicio para comenzar</p>
                </div>
              </td></tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  document.getElementById('btn-add-servicio').addEventListener('click', () => openServicioModal());

  document.getElementById('btn-export-servicios')?.addEventListener('click', () => {
    if (!servicios?.length) { showToast('No hay datos para exportar', 'error'); return; }
    exportWithHeaders(servicios, 'NailDesk-Servicios', {
      'Servicio': 'nombre',
      'Tiempo (hrs)': 'tiempo_horas',
      'Costo Total': 'costo_total',
      'Ganancia %': 'porcentaje_ganancia',
      'Precio Sugerido': 'precio_sugerido',
      'Precio Final': 'precio_redondeado',
      'Activo': 'activo'
    }, { widths: { 'Servicio': 25, 'Tiempo (hrs)': 10, 'Costo Total': 12, 'Ganancia %': 10, 'Precio Sugerido': 15, 'Precio Final': 15, 'Activo': 10 } });
    showToast('Archivo Excel descargado');
  });

  container.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', async () => {
      const s = servicios.find(x => x.id === btn.dataset.id);
      if (!s) return;
      const { data: si } = await supabase.from('servicio_insumos').select('*').eq('servicio_id', s.id);
      openServicioModal(s, si || []);
    });
  });

  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este servicio y sus insumos?')) return;
      await supabase.from('servicio_insumos').delete().eq('servicio_id', btn.dataset.id);
      await supabase.from('servicios').delete().eq('id', btn.dataset.id);
      showToast('Servicio eliminado');
      renderServicios();
    });
  });
}

function openServicioModal(servicio = null, insumosAsignados = []) {
  const isEdit = !!servicio;
  const tarifaMO = Number(perfilData?.tarifa_mano_obra_hora || 120);

  let modalInsumos = insumosAsignados.map(si => {
    const insumo = insumosCatalog.find(i => i.id === si.insumo_id);
    return {
      insumo_id: si.insumo_id,
      nombre: insumo?.producto || 'Desconocido',
      costo_por_uso: Number(insumo?.costo_por_uso) || 0,
      usos_gastados: Number(si.usos_gastados) || 1,
      costo_total: Number(si.costo_total) || 0,
    };
  });

  function renderModal() {
    return `
      <form id="servicio-form" class="space-y-4">
        <div>
          <label class="form-label">Nombre del servicio</label>
          <input type="text" id="s-nombre" class="form-input" value="${servicio?.nombre || ''}" required placeholder="Ej: Uñas acrílicas">
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="form-label">Tiempo (hrs)</label>
            <input type="number" step="0.5" id="s-tiempo" class="form-input" value="${servicio?.tiempo_horas || 1}" required>
          </div>
          <div>
            <label class="form-label">% Ganancia</label>
            <input type="number" id="s-ganancia" class="form-input" value="${servicio?.porcentaje_ganancia || 50}" required>
          </div>
          <div>
            <label class="form-label">Precio final</label>
            <input type="number" step="0.01" id="s-precio" class="form-input" value="${servicio?.precio_redondeado || 0}">
          </div>
        </div>

        <!-- Insumos Section -->
        <div class="rounded-xl p-4" style="background:var(--sand-50); border:1px solid var(--terracota-100)">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-bold flex items-center gap-2" style="color:var(--charcoal)">
              <i data-lucide="package" class="w-4 h-4" style="color:var(--terracota-400)"></i>
              Insumos asignados
            </h4>
            <span class="text-xs font-semibold" id="s-total-insumos" style="color:var(--terracota-500)">$0.00</span>
          </div>

          <div id="s-insumos-list" class="space-y-2 mb-3">
            ${renderInsumosList()}
          </div>

          <div class="flex gap-2">
            <select id="s-add-insumo" class="form-input flex-1 text-xs" style="padding:0.5rem 0.625rem">
              <option value="">Agregar insumo...</option>
              ${getAvailableInsumos().map(i => `<option value="${i.id}">${i.producto} — $${Number(i.costo_por_uso).toFixed(2)}/uso</option>`).join('')}
            </select>
            <button type="button" class="btn btn-secondary text-xs" id="s-btn-add-insumo" style="padding:0.5rem 0.75rem">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <!-- Cost Summary -->
        <div class="rounded-xl p-4 space-y-2" style="background:var(--terracota-50); border:1px solid var(--terracota-100)">
          <div class="flex justify-between text-xs">
            <span style="color:var(--terracota-400)">Materiales (insumos)</span>
            <span class="font-semibold" id="s-cost-materiales" style="color:var(--charcoal)">$0.00</span>
          </div>
          <div class="flex justify-between text-xs">
            <span style="color:var(--terracota-400)">Mano de obra (<span id="s-cost-mo-hrs">0</span>h × $${tarifaMO})</span>
            <span class="font-semibold" id="s-cost-mano-obra" style="color:var(--charcoal)">$0.00</span>
          </div>
          <div class="flex justify-between text-xs">
            <span style="color:var(--terracota-400)">Gastos fijos (<span id="s-cost-fijo-hrs">0</span>h × $${costoFijoPorHora.toFixed(2)})</span>
            <span class="font-semibold" id="s-cost-fijo" style="color:var(--charcoal)">$0.00</span>
          </div>
          <div class="flex justify-between text-sm font-bold pt-2" style="border-top:1.5px solid var(--terracota-200)">
            <span style="color:var(--charcoal)">Costo total</span>
            <span id="s-cost-total" style="color:var(--terracota-600)">$0.00</span>
          </div>
          <div class="flex justify-between text-xs">
            <span style="color:var(--terracota-400)">Precio sugerido (<span id="s-pct-ganancia-display">50</span>%)</span>
            <span class="font-semibold" id="s-precio-sugerido" style="color:var(--olive-600)">$0.00</span>
          </div>
        </div>

        <div>
          <label class="form-label">Descripción</label>
          <textarea id="s-desc" class="form-input" rows="2" placeholder="Opcional">${servicio?.descripcion || ''}</textarea>
        </div>

        <div class="flex gap-3 pt-2">
          <button type="button" class="btn btn-secondary flex-1" onclick="document.getElementById('modal-close-btn').click()">Cancelar</button>
          <button type="submit" class="btn btn-primary flex-1">${isEdit ? 'Guardar' : 'Crear'}</button>
        </div>
      </form>
    `;
  }

  function renderInsumosList() {
    if (modalInsumos.length === 0) {
      return '<p class="text-xs text-center py-3" style="color:var(--terracota-300)">Sin insumos asignados</p>';
    }
    return modalInsumos.map((mi, i) => `
      <div class="s-insumo-row flex items-center gap-2 p-2 rounded-lg" style="background:white; border:1px solid var(--terracota-100)">
        <div class="flex-1 min-w-0">
          <p class="text-xs font-semibold truncate" style="color:var(--charcoal)">${mi.nombre}</p>
          <p class="text-xs" style="color:var(--terracota-300)">$${mi.costo_por_uso.toFixed(2)}/uso</p>
        </div>
        <div class="flex items-center gap-1">
          <input type="number" min="0" step="1"
            class="s-usos-input form-input text-xs text-center"
            data-idx="${i}"
            value="${mi.usos_gastados}"
            style="width:56px; padding:0.25rem 0.375rem">
          <span class="text-xs" style="color:var(--terracota-400)">usos</span>
        </div>
        <span class="s-insumo-cost text-xs font-bold whitespace-nowrap" style="color:var(--olive-600)">$${mi.costo_total.toFixed(2)}</span>
        <button type="button" class="s-remove-insumo p-1 rounded-lg hover:bg-red-50 transition-colors" data-idx="${i}" title="Quitar insumo">
          <i data-lucide="trash-2" class="w-3.5 h-3.5" style="color:#dc6b4a"></i>
        </button>
      </div>
    `).join('');
  }

  function getAvailableInsumos() {
    return insumosCatalog.filter(i => !modalInsumos.find(mi => mi.insumo_id === i.id));
  }

  function refreshInsumosSection() {
    const list = document.getElementById('s-insumos-list');
    if (list) {
      list.innerHTML = renderInsumosList();
      bindInsumosEvents();
    }
    const select = document.getElementById('s-add-insumo');
    if (select) {
      select.innerHTML = `
        <option value="">Agregar insumo...</option>
        ${getAvailableInsumos().map(i => `<option value="${i.id}">${i.producto} — $${Number(i.costo_por_uso).toFixed(2)}/uso</option>`).join('')}
      `;
    }
    if (window.lucide) lucide.createIcons();
  }

  function bindInsumosEvents() {
    document.querySelectorAll('.s-remove-insumo').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        modalInsumos.splice(idx, 1);
        refreshInsumosSection();
        recalcCostos();
      });
    });

    document.querySelectorAll('.s-usos-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        if (isNaN(idx) || idx < 0 || idx >= modalInsumos.length) return;
        modalInsumos[idx].usos_gastados = Number(e.target.value) || 0;
        modalInsumos[idx].costo_total = modalInsumos[idx].usos_gastados * modalInsumos[idx].costo_por_uso;
        const costEl = e.target.closest('.s-insumo-row')?.querySelector('.s-insumo-cost');
        if (costEl) costEl.textContent = `$${modalInsumos[idx].costo_total.toFixed(2)}`;
        recalcCostos();
      });
    });
  }

  function recalcCostos() {
    const tiempo = Number(document.getElementById('s-tiempo')?.value || 0);
    const ganancia = Number(document.getElementById('s-ganancia')?.value || 0);

    const costoMateriales = modalInsumos.reduce((s, mi) => s + mi.costo_total, 0);
    const costoMO = tiempo * tarifaMO;
    const costoFijo = tiempo * costoFijoPorHora;
    const costoTotal = costoMateriales + costoMO + costoFijo;
    const precioSugerido = costoTotal * (1 + ganancia / 100);

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('s-total-insumos', `$${costoMateriales.toFixed(2)}`);
    set('s-cost-materiales', `$${costoMateriales.toFixed(2)}`);
    set('s-cost-mo-hrs', tiempo);
    set('s-cost-mano-obra', `$${costoMO.toFixed(2)}`);
    set('s-cost-fijo-hrs', tiempo);
    set('s-cost-fijo', `$${costoFijo.toFixed(2)}`);
    set('s-cost-total', `$${costoTotal.toFixed(2)}`);
    set('s-pct-ganancia-display', ganancia);
    set('s-precio-sugerido', `$${precioSugerido.toFixed(2)}`);
  }

  function getServicioId() {
    return servicio?.id || null;
  }

  async function getUserId() {
    const { data, error } = await supabase.auth.getUser();
    return data?.user?.id;
  }

  function openModalForm() {
    openModal(renderModal(), { title: isEdit ? 'Editar Servicio' : 'Nuevo Servicio' });
    if (window.lucide) lucide.createIcons();
    recalcCostos();
    bindInsumosEvents();

    document.getElementById('s-tiempo')?.addEventListener('input', recalcCostos);
    document.getElementById('s-ganancia')?.addEventListener('input', recalcCostos);

    document.getElementById('s-btn-add-insumo')?.addEventListener('click', () => {
      const select = document.getElementById('s-add-insumo');
      const insumoId = select.value;
      if (!insumoId) return;
      const insumo = insumosCatalog.find(i => i.id === insumoId);
      if (!insumo) return;

      modalInsumos.push({
        insumo_id: insumo.id,
        nombre: insumo.producto,
        costo_por_uso: Number(insumo.costo_por_uso) || 0,
        usos_gastados: 1,
        costo_total: Number(insumo.costo_por_uso) || 0,
      });

      refreshInsumosSection();
      recalcCostos();
    });

    document.getElementById('servicio-form')?.addEventListener('submit', handleSubmit);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';

    const userId = await getUserId();
    if (!userId) { showToast('Error: no se pudo obtener el usuario', 'error'); submitBtn.disabled = false; return; }

    const tiempo = Number(document.getElementById('s-tiempo').value);
    const ganancia = Number(document.getElementById('s-ganancia').value);
    const precioFinal = Number(document.getElementById('s-precio').value);

    const costoMateriales = modalInsumos.reduce((s, mi) => s + mi.costo_total, 0);
    const costoMO = tiempo * tarifaMO;
    const costoFijo = tiempo * costoFijoPorHora;
    const costoTotal = costoMateriales + costoMO + costoFijo;
    const precioSugerido = costoTotal * (1 + ganancia / 100);

    const servicioData = {
      user_id: userId,
      nombre: document.getElementById('s-nombre').value,
      tiempo_horas: tiempo,
      porcentaje_ganancia: ganancia,
      costo_materiales: costoMateriales,
      costo_total: costoTotal,
      precio_sugerido: precioSugerido,
      precio_redondeado: precioFinal || precioSugerido,
      descripcion: document.getElementById('s-desc').value,
    };

    try {
      let servicioId;

      if (isEdit) {
        servicioId = servicio.id;
        const { error: updateErr } = await supabase.from('servicios').update(servicioData).eq('id', servicioId);
        if (updateErr) throw updateErr;

        const { error: deleteErr } = await supabase.from('servicio_insumos').delete().eq('servicio_id', servicioId);
        if (deleteErr) throw deleteErr;
      } else {
        const { data: newServ, error: insertErr } = await supabase.from('servicios').insert(servicioData).select().single();
        if (insertErr) throw insertErr;
        servicioId = newServ.id;
      }

      if (servicioId && modalInsumos.length > 0) {
        const insumosInsert = modalInsumos.map(mi => ({
          servicio_id: servicioId,
          user_id: userId,
          insumo_id: mi.insumo_id,
          usos_gastados: mi.usos_gastados,
          costo_total: mi.costo_total,
        }));
        const { error: siErr } = await supabase.from('servicio_insumos').insert(insumosInsert);
        if (siErr) throw siErr;
      }

      showToast(isEdit ? 'Servicio actualizado' : 'Servicio creado');
      closeModal();
      renderServicios();
    } catch (err) {
      console.error('Error guardando servicio:', err);
      showToast(`Error: ${err.message || 'No se pudo guardar'}`, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = isEdit ? 'Guardar' : 'Crear';
    }
  }

  openModalForm();
}
