// ============================================================
// NailDesk — Cotizador (Calculadora de Costos / Pricing)
// ============================================================

import supabase from '../supabase.js';
import { showToast } from '../components/toast.js';

let perfil = null;
let servicios = [];
let extras = [];
let servicioInsumos = [];
let insumosMap = {};
let costoFijoPorHora = 0;
let items = [];
let conIVA = false;
let clienteNombre = '';
let notasCotizacion = '';

const IVA_RATE = 0.16;

export async function renderCotizador() {
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="flex items-center justify-center py-20"><div class="spinner"></div></div>`;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const [perfilRes, serviciosRes, extrasRes, siRes, iRes, resumenRes] = await Promise.all([
    supabase.from('perfiles_negocio').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('servicios').select('*').eq('user_id', user.id).eq('activo', true).order('nombre'),
    supabase.from('extras').select('*').eq('user_id', user.id).eq('activo', true).order('nombre'),
    supabase.from('servicio_insumos').select('*, insumos(*)').eq('user_id', user.id),
    supabase.from('insumos').select('*').eq('user_id', user.id).eq('activo', true),
    supabase.from('vista_resumen_negocio').select('*').eq('user_id', user.id).maybeSingle(),
  ]);

  perfil = perfilRes.data;
  servicios = serviciosRes.data || [];
  extras = extrasRes.data || [];
  servicioInsumos = siRes.data || [];
  costoFijoPorHora = Number(resumenRes.data?.costo_fijo_por_hora || 0);

  insumosMap = {};
  (iRes.data || []).forEach(i => { insumosMap[i.id] = i; });

  items = [];
  conIVA = false;
  clienteNombre = '';
  notasCotizacion = '';

  render();
}

function render() {
  const container = document.getElementById('page-content');
  container.innerHTML = `
    <div class="cotizador-layout animate-in">
      <!-- Mobile Toggle -->
      <div class="cotizador-mobile-toggle lg:hidden">
        <button class="cotizador-tab active" data-tab="constructor">Constructor</button>
        <button class="cotizador-tab" data-tab="preview">Vista Previa</button>
      </div>

      <!-- Left: Constructor -->
      <div class="cotizador-panel cotizador-constructor" id="cotizador-constructor">
        <div class="cotizador-panel-header">
          <h3><i data-lucide="wrench" class="w-4 h-4"></i> Constructor</h3>
        </div>

        <div class="cotizador-panel-body">
          <!-- Cliente -->
          <div class="cotizador-field">
            <label class="form-label">Cliente</label>
            <input type="text" id="cot-cliente" class="form-input" placeholder="Nombre del cliente (opcional)" value="${clienteNombre}">
          </div>

          <!-- Agregar Servicio -->
          <div class="cotizador-field">
            <label class="form-label">Agregar servicio</label>
            <select id="cot-add-servicio" class="form-input">
              <option value="">Seleccionar servicio...</option>
              ${servicios.map(s => `<option value="${s.id}">${s.nombre} — $${Number(s.precio_redondeado).toLocaleString('es-MX')}</option>`).join('')}
            </select>
          </div>

          <!-- Lista de servicios -->
          <div id="cot-items-servicios" class="space-y-3">
            ${items.filter(i => i.tipo === 'servicio').map((item, idx) => renderItemCard(item, idx)).join('')}
          </div>

          <!-- Agregar Extra -->
          <div class="cotizador-field mt-4">
            <label class="form-label">Agregar extra</label>
            <select id="cot-add-extra" class="form-input">
              <option value="">Seleccionar extra...</option>
              ${extras.map(e => `<option value="${e.id}">${e.nombre} — $${Number(e.precio_redondeado).toLocaleString('es-MX')}</option>`).join('')}
            </select>
          </div>

          <!-- Lista de extras -->
          <div id="cot-items-extras" class="space-y-3">
            ${items.filter(i => i.tipo === 'extra').map((item, idx) => renderItemCard(item, idx)).join('')}
          </div>

          <!-- Notas -->
          <div class="cotizador-field mt-4">
            <label class="form-label">Notas</label>
            <textarea id="cot-notas" class="form-input" rows="2" placeholder="Notas adicionales (opcional)">${notasCotizacion}</textarea>
          </div>

          <!-- IVA Toggle -->
          <div class="flex items-center justify-between mt-4 p-3 rounded-xl" style="background:var(--terracota-50)">
            <span class="text-sm font-semibold" style="color:var(--charcoal)">Incluir IVA (16%)</span>
            <div class="toggle ${conIVA ? 'active' : ''}" id="cot-iva-toggle"></div>
          </div>
        </div>
      </div>

      <!-- Right: Preview -->
      <div class="cotizador-panel cotizador-preview" id="cotizador-preview">
        <div class="cotizador-panel-header">
          <h3><i data-lucide="eye" class="w-4 h-4"></i> Vista Previa</h3>
        </div>

        <div class="cotizador-panel-body">
          <div class="cotizador-invoice" id="cotizador-invoice">
            <!-- Header -->
            <div class="cotizador-invoice-header">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-terracota-300 to-terracota-500 flex items-center justify-center">
                  <i data-lucide="sparkles" class="w-5 h-5 text-white"></i>
                </div>
                <div>
                  <h4 class="font-display text-base font-bold" style="color:var(--charcoal)">${perfil?.nombre_salon || 'Mi Salón'}</h4>
                  <p class="text-xs" style="color:var(--terracota-400)">Cotización de servicios</p>
                </div>
              </div>
              <div class="flex justify-between items-end text-xs" style="color:var(--terracota-400)">
                <span id="cot-preview-fecha">${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span id="cot-preview-cliente" class="font-semibold" style="color:var(--charcoal)">${clienteNombre || 'Cliente'}</span>
              </div>
            </div>

            <!-- Items -->
            <div class="cotizador-invoice-body" id="cot-preview-items">
              ${renderPreviewItems()}
            </div>

            <!-- Totals -->
            <div class="cotizador-invoice-footer" id="cot-preview-totals">
              ${renderPreviewTotals()}
            </div>

            ${notasCotizacion ? `<div class="mt-3 p-3 rounded-lg text-xs" style="background:var(--terracota-50); color:var(--terracota-600)"><strong>Notas:</strong> ${notasCotizacion}</div>` : ''}
          </div>

          <!-- Actions -->
          <div class="flex gap-3 mt-4">
            <button class="btn btn-secondary flex-1" id="cot-btn-guardar">
              <i data-lucide="save" class="w-4 h-4"></i> Guardar
            </button>
            <button class="btn btn-primary flex-1" id="cot-btn-pdf">
              <i data-lucide="download" class="w-4 h-4"></i> Exportar PDF
            </button>
          </div>
          <button class="btn btn-ghost w-full mt-2" id="cot-btn-nueva">
            <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Nueva cotización
          </button>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
  bindEvents();
}

function renderItemCard(item, globalIdx) {
  const isServicio = item.tipo === 'servicio';
  const icon = isServicio ? 'scissors' : 'plus-circle';
  const color = isServicio ? 'var(--terracota-500)' : 'var(--olive-500)';

  return `
    <div class="cotizador-item-card" data-idx="${globalIdx}">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:${color}15">
            <i data-lucide="${icon}" class="w-3.5 h-3.5" style="color:${color}"></i>
          </div>
          <span class="text-sm font-semibold" style="color:var(--charcoal)">${item.nombre}</span>
        </div>
        <button class="p-1 rounded-lg hover:bg-red-50 transition-colors cot-remove-item" data-idx="${globalIdx}">
          <i data-lucide="x" class="w-4 h-4" style="color:#dc6b4a"></i>
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2 mb-2 text-xs">
        <div class="cot-cost-row">
          <span>Insumos</span>
          <span class="font-semibold">$${item.costo_insumos.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
        </div>
        <div class="cot-cost-row">
          <span>Mano de obra</span>
          <span class="font-semibold">$${item.costo_mano_obra.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
        </div>
        <div class="cot-cost-row">
          <span>Gastos fijos</span>
          <span class="font-semibold">$${item.costo_fijo.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
        </div>
        <div class="cot-cost-row">
          <span>Costo total</span>
          <span class="font-bold" style="color:var(--charcoal)">$${item.costo_total.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="flex-1">
          <label class="text-xs font-semibold" style="color:var(--terracota-600)">Precio de cobro</label>
          <div class="relative mt-1">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style="color:var(--terracota-400)">$</span>
            <input type="number" step="1" min="0"
              class="form-input text-sm font-bold pl-7 cot-price-input"
              data-idx="${globalIdx}"
              value="${item.precio}"
              style="color:var(--charcoal)">
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs" style="color:var(--terracota-400)">Ganancia</span>
          <p class="text-sm font-bold ${item.ganancia >= 0 ? 'text-green-700' : 'text-red-600'}">
            $${item.ganancia.toLocaleString('es-MX', {minimumFractionDigits: 2})}
          </p>
          <span class="text-xs ${item.ganancia >= 0 ? 'text-green-600' : 'text-red-500'}">${item.margenPct.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  `;
}

function renderPreviewItems() {
  if (items.length === 0) {
    return `<div class="text-center py-8" style="color:var(--terracota-300)">
      <p class="text-sm">Agrega servicios o extras para ver la cotización</p>
    </div>`;
  }

  return `
    <table class="cot-preview-table">
      <thead>
        <tr>
          <th>Concepto</th>
          <th class="text-center">Cant.</th>
          <th class="text-right">Precio</th>
          <th class="text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>
              <span class="font-medium" style="color:var(--charcoal)">${item.nombre}</span>
              <span class="text-xs ml-1" style="color:var(--terracota-300)">${item.tipo === 'servicio' ? 'Servicio' : 'Extra'}</span>
            </td>
            <td class="text-center">${item.cantidad}</td>
            <td class="text-right">$${Number(item.precio).toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
            <td class="text-right font-semibold" style="color:var(--charcoal)">$${(item.cantidad * item.precio).toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderPreviewTotals() {
  const subtotal = items.reduce((s, i) => s + (i.cantidad * i.precio), 0);
  const iva = conIVA ? subtotal * IVA_RATE : 0;
  const total = subtotal + iva;

  return `
    <div class="cot-preview-totals">
      <div class="flex justify-between text-sm">
        <span style="color:var(--terracota-400)">Subtotal</span>
        <span class="font-semibold" style="color:var(--charcoal)">$${subtotal.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
      </div>
      ${conIVA ? `
        <div class="flex justify-between text-sm">
          <span style="color:var(--terracota-400)">IVA (16%)</span>
          <span class="font-semibold" style="color:var(--charcoal)">$${iva.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
        </div>
      ` : ''}
      <div class="flex justify-between text-base font-bold pt-2 mt-2" style="border-top: 2px solid var(--terracota-200)">
        <span style="color:var(--charcoal)">Total</span>
        <span style="color:var(--terracota-600)">$${total.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
      </div>
    </div>
  `;
}

function calcularCostos(servicioId) {
  const s = servicios.find(x => x.id === servicioId);
  if (!s) return null;

  const tiempo = Number(s.tiempo_horas) || 1;
  const tarifaMO = Number(perfil?.tarifa_mano_obra_hora || 120);

  const si = servicioInsumos.filter(x => x.servicio_id === servicioId);
  let costoInsumos = 0;
  si.forEach(x => {
    costoInsumos += Number(x.costo_total) || 0;
  });

  const costoMO = tiempo * tarifaMO;
  const costoFijo = tiempo * costoFijoPorHora;
  const costoTotal = costoInsumos + costoMO + costoFijo;

  return {
    nombre: s.nombre,
    tipo: 'servicio',
    item_id: s.id,
    cantidad: 1,
    costo_insumos: costoInsumos,
    costo_mano_obra: costoMO,
    costo_fijo: costoFijo,
    costo_total: costoTotal,
    precio: Number(s.precio_redondeado) || costoTotal,
    get ganancia() { return (this.cantidad * this.precio) - (this.cantidad * this.costo_total); },
    get margenPct() { return this.costo_total > 0 ? ((this.precio - this.costo_total) / this.costo_total * 100) : 0; },
  };
}

function calcularCostoExtra(extraId) {
  const e = extras.find(x => x.id === extraId);
  if (!e) return null;

  return {
    nombre: e.nombre,
    tipo: 'extra',
    item_id: e.id,
    cantidad: 1,
    costo_insumos: 0,
    costo_mano_obra: 0,
    costo_fijo: 0,
    costo_total: Number(e.costo_aprox) || 0,
    precio: Number(e.precio_redondeado) || 0,
    get ganancia() { return (this.cantidad * this.precio) - (this.cantidad * this.costo_total); },
    get margenPct() { return this.costo_total > 0 ? ((this.precio - this.costo_total) / this.costo_total * 100) : 0; },
  };
}

function bindEvents() {
  document.getElementById('cot-add-servicio')?.addEventListener('change', (e) => {
    const id = e.target.value;
    if (!id) return;
    const item = calcularCostos(id);
    if (item) {
      items.push(item);
      refresh();
    }
    e.target.value = '';
  });

  document.getElementById('cot-add-extra')?.addEventListener('change', (e) => {
    const id = e.target.value;
    if (!id) return;
    const item = calcularCostoExtra(id);
    if (item) {
      items.push(item);
      refresh();
    }
    e.target.value = '';
  });

  document.querySelectorAll('.cot-price-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      items[idx].precio = Number(e.target.value) || 0;
      refreshPreview();
    });
  });

  document.querySelectorAll('.cot-remove-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.dataset.idx);
      items.splice(idx, 1);
      refresh();
    });
  });

  document.getElementById('cot-iva-toggle')?.addEventListener('click', function() {
    conIVA = !conIVA;
    this.classList.toggle('active');
    refreshPreview();
  });

  document.getElementById('cot-cliente')?.addEventListener('input', (e) => {
    clienteNombre = e.target.value;
    document.getElementById('cot-preview-cliente').textContent = clienteNombre || 'Cliente';
  });

  document.getElementById('cot-notas')?.addEventListener('input', (e) => {
    notasCotizacion = e.target.value;
    const invoice = document.getElementById('cotizador-invoice');
    const existingNotes = invoice.querySelector('.cot-notes');
    if (existingNotes) existingNotes.remove();
    if (notasCotizacion) {
      const div = document.createElement('div');
      div.className = 'cot-notes mt-3 p-3 rounded-lg text-xs';
      div.style.cssText = 'background:var(--terracota-50); color:var(--terracota-600)';
      div.innerHTML = `<strong>Notas:</strong> ${notasCotizacion}`;
      invoice.appendChild(div);
    }
  });

  document.querySelectorAll('.cotizador-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cotizador-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.getElementById('cotizador-constructor').style.display = target === 'constructor' ? '' : 'none';
      document.getElementById('cotizador-preview').style.display = target === 'preview' ? '' : 'none';
    });
  });

  document.getElementById('cot-btn-guardar')?.addEventListener('click', saveCotizacion);
  document.getElementById('cot-btn-pdf')?.addEventListener('click', exportPDF);

  document.getElementById('cot-btn-nueva')?.addEventListener('click', () => {
    items = [];
    clienteNombre = '';
    notasCotizacion = '';
    conIVA = false;
    refresh();
    showToast('Nueva cotización', 'info');
  });
}

function refresh() {
  const constructor = document.getElementById('cotizador-constructor');
  const prevScroll = constructor?.scrollTop || 0;
  render();
  const newConstructor = document.getElementById('cotizador-constructor');
  if (newConstructor) newConstructor.scrollTop = prevScroll;
}

function refreshPreview() {
  const previewBody = document.getElementById('cot-preview-items');
  const previewFooter = document.getElementById('cot-preview-totals');
  if (previewBody) previewBody.innerHTML = renderPreviewItems();
  if (previewFooter) previewFooter.innerHTML = renderPreviewTotals();

  document.querySelectorAll('.cot-price-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      items[idx].precio = Number(e.target.value) || 0;
      refreshPreview();
    });
  });

  document.querySelectorAll('.cot-remove-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      items.splice(idx, 1);
      refresh();
    });
  });

  if (window.lucide) lucide.createIcons();
}

async function saveCotizacion() {
  if (items.length === 0) {
    showToast('Agrega al menos un servicio o extra', 'error');
    return;
  }

  const subtotal = items.reduce((s, i) => s + (i.cantidad * i.precio), 0);
  const iva = conIVA ? subtotal * IVA_RATE : 0;
  const total = subtotal + iva;

  const { data: cot, error } = await supabase.from('cotizaciones').insert({
    user_id: (await supabase.auth.getUser()).data.user.id,
    cliente_nombre: clienteNombre || null,
    notas: notasCotizacion || null,
    subtotal,
    iva,
    total,
    guardada: true,
  }).select().single();

  if (error) { showToast('Error al guardar', 'error'); return; }

  const userId = (await supabase.auth.getUser()).data.user.id;
  const itemsToInsert = items.map(i => ({
    cotizacion_id: cot.id,
    user_id: userId,
    tipo: i.tipo,
    item_id: i.item_id,
    nombre: i.nombre,
    cantidad: i.cantidad,
    costo_unitario: i.costo_total,
    precio_unitario: i.precio,
  }));

  await supabase.from('cotizacion_items').insert(itemsToInsert);
  showToast('Cotización guardada');
}

async function exportPDF() {
  if (items.length === 0) {
    showToast('Agrega al menos un servicio o extra', 'error');
    return;
  }

  if (!window.jspdf) {
    showToast('Error: jsPDF no se cargó. Recarga la página.', 'error');
    return;
  }

  showToast('Generando PDF...', 'info');

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'letter');
    const pageW = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentW = pageW - margin * 2;
    let y = margin;

    // Colors — Nude palette
    const rose = [160, 96, 122];
    const charcoal = [26, 26, 26];
    const gray = [107, 114, 128];
    const lightGray = [229, 231, 235];

    // --- Header ---
    pdf.setFillColor(...rose);
    pdf.roundedRect(margin, y, contentW, 22, 3, 3, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text(perfil?.nombre_salon || 'NailDesk', margin + 8, y + 10);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('COTIZACION', margin + 8, y + 16);
    y += 30;

    // --- Cliente y Fecha ---
    pdf.setFontSize(9);
    pdf.setTextColor(...gray);
    const fecha = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    pdf.text(`Fecha: ${fecha}`, margin, y);
    pdf.text(`Cliente: ${clienteNombre || '---'}`, pageW - margin, y, { align: 'right' });
    y += 10;

    // --- Separator ---
    pdf.setDrawColor(...lightGray);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, pageW - margin, y);
    y += 8;

    // --- Table Header ---
    pdf.setFillColor(248, 248, 250);
    pdf.rect(margin, y, contentW, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...gray);
    pdf.text('CONCEPTO', margin + 4, y + 5.5);
    pdf.text('CANT.', margin + contentW * 0.55, y + 5.5, { align: 'center' });
    pdf.text('PRECIO', margin + contentW * 0.72, y + 5.5, { align: 'center' });
    pdf.text('SUBTOTAL', margin + contentW - 4, y + 5.5, { align: 'right' });
    y += 10;

    // --- Items ---
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    items.forEach((item, idx) => {
      if (y > 240) {
        pdf.addPage();
        y = margin;
      }

      if (idx % 2 === 0) {
        pdf.setFillColor(250, 250, 252);
        pdf.rect(margin, y - 1, contentW, 8, 'F');
      }

      pdf.setTextColor(...charcoal);
      pdf.setFont('helvetica', 'bold');
      pdf.text(item.nombre, margin + 4, y + 4);

      const tipoLabel = item.tipo === 'servicio' ? 'Srv' : 'Ext';
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(...gray);
      pdf.text(tipoLabel, margin + 4 + pdf.getTextWidth(item.nombre) + 2, y + 4);

      pdf.setFontSize(9);
      pdf.setTextColor(...charcoal);
      pdf.text(String(item.cantidad), margin + contentW * 0.55, y + 4, { align: 'center' });
      pdf.text(`$${Number(item.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, margin + contentW * 0.72, y + 4, { align: 'center' });

      const sub = item.cantidad * item.precio;
      pdf.setFont('helvetica', 'bold');
      pdf.text(`$${sub.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, margin + contentW - 4, y + 4, { align: 'right' });

      y += 8;
    });

    // --- Separator ---
    y += 2;
    pdf.setDrawColor(...lightGray);
    pdf.setLineWidth(0.3);
    pdf.line(margin + contentW * 0.5, y, pageW - margin, y);
    y += 6;

    // --- Totals ---
    const subtotal = items.reduce((s, i) => s + (i.cantidad * i.precio), 0);
    const iva = conIVA ? subtotal * 0.16 : 0;
    const total = subtotal + iva;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...gray);
    pdf.text('Subtotal:', margin + contentW * 0.6, y);
    pdf.text(`$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, margin + contentW - 4, y, { align: 'right' });
    y += 6;

    if (conIVA) {
      pdf.text('IVA (16%):', margin + contentW * 0.6, y);
      pdf.text(`$${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, margin + contentW - 4, y, { align: 'right' });
      y += 6;
    }

    // Total box
    pdf.setFillColor(...rose);
    pdf.roundedRect(margin + contentW * 0.5, y - 3, contentW * 0.5, 10, 2, 2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(255, 255, 255);
    pdf.text('TOTAL', margin + contentW * 0.55, y + 4);
    pdf.text(`$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, margin + contentW - 6, y + 4, { align: 'right' });
    y += 16;

    // --- Notas ---
    if (notasCotizacion) {
      if (y > 240) { pdf.addPage(); y = margin; }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(...gray);
      pdf.text('NOTAS:', margin, y);
      y += 5;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      const splitNotes = pdf.splitTextToSize(notasCotizacion, contentW - 4);
      pdf.text(splitNotes, margin + 2, y);
      y += splitNotes.length * 4 + 4;
    }

    // --- Footer ---
    const footerY = pdf.internal.pageSize.getHeight() - 12;
    pdf.setFontSize(7);
    pdf.setTextColor(...gray);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Generado con NailDesk — Gestion de Salon', pageW / 2, footerY, { align: 'center' });

    const cliente = clienteNombre || 'cliente';
    const fechaFile = new Date().toISOString().split('T')[0];
    pdf.save(`cotizacion_${cliente}_${fechaFile}.pdf`);
    showToast('PDF exportado correctamente');
  } catch (err) {
    console.error('Error exporting PDF:', err);
    showToast(`Error al exportar PDF: ${err.message}`, 'error');
  }
}
