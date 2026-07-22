// ============================================================
// NailDesk — Dashboard View
// ============================================================

import supabase from '../supabase.js';
import { renderUpgradeBanner } from '../components/upgrade-banner.js';
import { escapeHtml } from '../utils/escape-html.js';

let chartInstance = null;

const SKELETON_HTML = `
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <div class="skeleton skeleton-card stagger-1 animate-in"></div>
    <div class="skeleton skeleton-card stagger-2 animate-in"></div>
    <div class="skeleton skeleton-card stagger-3 animate-in"></div>
    <div class="skeleton skeleton-card stagger-4 animate-in"></div>
  </div>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
    <div class="lg:col-span-2 skeleton skeleton-card animate-in" style="height:280px"></div>
    <div class="skeleton skeleton-card animate-in" style="height:280px"></div>
  </div>
`;

export async function renderDashboard() {
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="flex items-center justify-center py-20"><div class="spinner"></div></div>`;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const [perfilRes, ventasRes, serviciosRes, insumosRes] = await Promise.all([
    supabase.from('vista_resumen_negocio').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('ventas')
      .select('precio_cobrado, costo_estimado, fecha, metodo_pago, cliente_nombre, servicio_nombre')
      .eq('user_id', user.id)
      .order('fecha', { ascending: false }).limit(30),
    supabase.from('servicios')
      .select('nombre, precio_redondeado, tiempo_horas').eq('user_id', user.id).eq('activo', true),
    supabase.from('insumos')
      .select('producto, stock_actual, costo_por_uso').eq('user_id', user.id).eq('activo', true).order('stock_actual', { ascending: true })
  ]);

  const perfil = perfilRes.data;
  const ventas = ventasRes.data;
  const servicios = serviciosRes.data;
  const insumos = insumosRes.data;

  const totalVentas = ventas?.reduce((s, v) => s + (Number(v.precio_cobrado) || 0), 0) || 0;
  const totalCostos = ventas?.reduce((s, v) => s + (Number(v.costo_estimado) || 0), 0) || 0;
  const ganancia = totalVentas - totalCostos;
  const numVentas = ventas?.length || 0;
  const margen = totalVentas > 0 ? ((ganancia / totalVentas) * 100).toFixed(0) : 0;

  const now = new Date();
  const fechaLarga = now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const hora = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  container.innerHTML = `
    <div id="upgrade-banner-slot"></div>

    <!-- Hero Card -->
    <div class="hero-card mb-6 animate-in">
      <div class="relative z-10">
        <p class="text-white/50 text-xs font-medium tracking-wide mb-1">${fechaLarga} · ${hora}</p>
        <h2 class="font-display text-2xl font-bold mb-2">Buenas ${now.getHours() < 12 ? 'días' : now.getHours() < 19 ? 'tardes' : 'noches'} ✨</h2>
        <p class="text-white/65 text-sm max-w-md">Resumen de <strong class="text-white">${escapeHtml(perfil?.nombre_salon) || 'tu salón'}</strong> — ${perfil?.total_servicios || 0} servicios activos, ${perfil?.total_insumos || 0} insumos en catálogo.</p>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-in stagger-1">
      <a href="#/ventas" class="quick-action">
        <div class="quick-action-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <span>Nueva Venta</span>
      </a>
      <a href="#/cotizador" class="quick-action">
        <div class="quick-action-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        </div>
        <span>Cotizar</span>
      </a>
      <a href="#/insumos" class="quick-action">
        <div class="quick-action-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        </div>
        <span>Insumos</span>
      </a>
      <a href="#/configuracion" class="quick-action">
        <div class="quick-action-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </div>
        <span>Config</span>
      </a>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="stat-card terracota animate-in stagger-2">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold uppercase tracking-wider" style="color:var(--terracota-400)">Ingresos</span>
          <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:var(--terracota-50)">
            <i data-lucide="dollar-sign" class="w-[18px] h-[18px]" style="color:var(--terracota-500)"></i>
          </div>
        </div>
        <p class="text-2xl font-bold" style="color:var(--charcoal)">$${totalVentas.toLocaleString('es-MX', {minimumFractionDigits: 0})}</p>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-xs" style="color:var(--terracota-300)">${numVentas} ventas</span>
          ${numVentas > 0 ? `<span class="trend trend-up">↑</span>` : ''}
        </div>
      </div>

      <div class="stat-card olive animate-in stagger-3">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold uppercase tracking-wider" style="color:var(--olive-500)">Ganancia</span>
          <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:var(--olive-50)">
            <i data-lucide="trending-up" class="w-[18px] h-[18px]" style="color:var(--olive-500)"></i>
          </div>
        </div>
        <p class="text-2xl font-bold ${ganancia >= 0 ? 'text-green-700' : 'text-red-600'}">$${ganancia.toLocaleString('es-MX', {minimumFractionDigits: 0})}</p>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-xs" style="color:var(--terracota-300)">${margen}% margen</span>
          <span class="trend ${ganancia >= 0 ? 'trend-up' : 'trend-down'}">${ganancia >= 0 ? '↑' : '↓'}</span>
        </div>
      </div>

      <div class="stat-card sand animate-in stagger-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold uppercase tracking-wider" style="color:var(--terracota-400)">Costos Fijos</span>
          <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:var(--terracota-50)">
            <i data-lucide="receipt" class="w-[18px] h-[18px]" style="color:var(--terracota-400)"></i>
          </div>
        </div>
        <p class="text-2xl font-bold" style="color:var(--charcoal)">$${(perfil?.total_costos_fijos || 0).toLocaleString('es-MX')}</p>
        <span class="text-xs mt-1 block" style="color:var(--terracota-300)">$${(perfil?.costo_fijo_por_hora || 0)}/hr fijo</span>
      </div>

      <div class="stat-card warm animate-in stagger-5">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold uppercase tracking-wider" style="color:var(--terracota-400)">Catálogo</span>
          <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:var(--terracota-50)">
            <i data-lucide="scissors" class="w-[18px] h-[18px]" style="color:var(--terracota-400)"></i>
          </div>
        </div>
        <p class="text-2xl font-bold" style="color:var(--charcoal)">${perfil?.total_servicios || 0}</p>
        <span class="text-xs mt-1 block" style="color:var(--terracota-300)">servicios · ${perfil?.total_insumos || 0} insumos</span>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Chart (2 cols) -->
      <div class="lg:col-span-2 card-elevated p-5 animate-in stagger-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold" style="color:var(--charcoal)">Ventas Recientes</h3>
          <span class="text-xs" style="color:var(--terracota-300)">Últimos registros</span>
        </div>
        <div style="height:220px"><canvas id="chart-ventas"></canvas></div>
      </div>

      <!-- Servicios (1 col) -->
      <div class="card-elevated p-5 animate-in stagger-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold" style="color:var(--charcoal)">Servicios</h3>
          <a href="#/servicios" class="text-xs font-semibold" style="color:var(--terracota-500)">Ver todos →</a>
        </div>
        <div class="space-y-2">
          ${servicios?.slice(0, 6).map(s => `
            <div class="flex items-center justify-between py-2 px-3 rounded-lg" style="background:var(--sand-50)">
              <div>
                <p class="text-sm font-medium" style="color:var(--charcoal)">${escapeHtml(s.nombre)}</p>
                <p class="text-[11px]" style="color:var(--terracota-300)">${s.tiempo_horas}h</p>
              </div>
              <span class="text-sm font-bold" style="color:var(--terracota-500)">$${Number(s.precio_redondeado).toLocaleString('es-MX')}</span>
            </div>
          `).join('') || `
            <div class="empty-state" style="padding:1.5rem 0">
              <div class="empty-state-icon" style="width:56px;height:56px;margin:0 auto 0.75rem">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;stroke:var(--rose-deep)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <p class="text-sm" style="color:var(--text-muted)">Sin servicios aún</p>
            </div>
          `}
        </div>
      </div>
    </div>

    <!-- Low Stock Alert -->
    ${insumos && insumos.length > 0 ? `
    <div class="card-elevated p-5 mt-6 animate-in stagger-6">
      <div class="flex items-center gap-2 mb-4">
        <i data-lucide="alert-triangle" class="w-4 h-4" style="color:var(--terracota-400)"></i>
        <h3 class="text-sm font-bold" style="color:var(--charcoal)">Stock Bajo</h3>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        ${insumos.filter(i => i.stock_actual <= 3).slice(0, 6).map(i => `
          <div class="flex items-center justify-between py-2 px-3 rounded-lg border" style="border-color:var(--terracota-100); background:var(--sand-50)">
            <span class="text-sm" style="color:var(--charcoal)">${escapeHtml(i.producto)}</span>
            <span class="badge ${i.stock_actual === 0 ? 'badge-danger' : 'badge-warning'}">${i.stock_actual} usos</span>
          </div>
        `).join('') || `
          <div class="col-span-full text-center py-3">
            <p class="text-sm" style="color:var(--olive-500)">✓ Todo con buen stock</p>
          </div>
        `}
      </div>
    </div>
    ` : ''}
  `;

  if (window.lucide) lucide.createIcons();
  renderUpgradeBanner(document.getElementById('upgrade-banner-slot'));
  renderVentasChart(ventas);
}

function renderVentasChart(ventas) {
  const canvas = document.getElementById('chart-ventas');
  if (!canvas) return;
  if (chartInstance) chartInstance.destroy();

  const grouped = {};
  (ventas || []).forEach(v => {
    const date = v.fecha;
    if (!grouped[date]) grouped[date] = { ingresos: 0, ganancia: 0 };
    grouped[date].ingresos += Number(v.precio_cobrado) || 0;
    grouped[date].ganancia += (Number(v.precio_cobrado) || 0) - (Number(v.costo_estimado) || 0);
  });

  const labels = Object.keys(grouped).sort().slice(-7);
  const ingresos = labels.map(d => grouped[d].ingresos);
  const ganancias = labels.map(d => grouped[d].ganancia);

  chartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels.map(d => new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })),
      datasets: [
        { label: 'Ingresos', data: ingresos, backgroundColor: 'rgba(160,96,122,0.65)', borderRadius: 6, borderSkipped: false },
        { label: 'Ganancia', data: ganancias, backgroundColor: 'rgba(139,168,136,0.65)', borderRadius: 6, borderSkipped: false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16, font: { size: 11 } } } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#E5E7EB20' }, ticks: { font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
}
