// ============================================================
// NailDesk — Dashboard View
// ============================================================

import supabase from '../supabase.js';
import { renderUpgradeBanner } from '../components/upgrade-banner.js';
import { escapeHtml } from '../utils/escape-html.js';

let chartInstance = null;

export async function renderDashboard() {
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="flex items-center justify-center py-20"><div class="spinner"></div></div>`;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: perfil } = await supabase.from('vista_resumen_negocio').select('*').eq('user_id', user.id).maybeSingle();
  const { data: ventas } = await supabase.from('ventas')
    .select('precio_cobrado, costo_estimado, fecha, metodo_pago, cliente_nombre, servicio_nombre')
    .eq('user_id', user.id)
    .order('fecha', { ascending: false }).limit(30);
  const { data: servicios } = await supabase.from('servicios')
    .select('nombre, precio_redondeado, tiempo_horas').eq('user_id', user.id).eq('activo', true);
  const { data: insumos } = await supabase.from('insumos')
    .select('producto, stock_actual, costo_por_uso').eq('user_id', user.id).eq('activo', true).order('stock_actual', { ascending: true });

  const totalVentas = ventas?.reduce((s, v) => s + (Number(v.precio_cobrado) || 0), 0) || 0;
  const totalCostos = ventas?.reduce((s, v) => s + (Number(v.costo_estimado) || 0), 0) || 0;
  const ganancia = totalVentas - totalCostos;
  const numVentas = ventas?.length || 0;

  const now = new Date();
  const fechaLarga = now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const hora = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  container.innerHTML = `
    <!-- Upgrade Banner (Free plan users only) -->
    <div id="upgrade-banner-slot"></div>

    <!-- Hero -->
    <div class="hero-card mb-6 animate-in">
      <div class="relative z-10">
        <p class="text-white/60 text-sm mb-1">${fechaLarga} · ${hora}</p>
        <h2 class="font-display text-2xl font-bold mb-2">Buenas ${now.getHours() < 12 ? 'días' : now.getHours() < 19 ? 'tardes' : 'noches'} ✨</h2>
        <p class="text-white/70 text-sm max-w-md">Resumen de <strong class="text-white">${escapeHtml(perfil?.nombre_salon) || 'tu salón'}</strong> — ${perfil?.total_servicios || 0} servicios activos, ${perfil?.total_insumos || 0} insumos en catálogo.</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="stat-card terracota animate-in-delay-1">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold uppercase tracking-wider" style="color:var(--terracota-400)">Ingresos</span>
          <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:var(--terracota-50)">
            <i data-lucide="dollar-sign" class="w-[18px] h-[18px]" style="color:var(--terracota-500)"></i>
          </div>
        </div>
        <p class="text-2xl font-bold" style="color:var(--charcoal)">$${totalVentas.toLocaleString('es-MX', {minimumFractionDigits: 0})}</p>
        <p class="text-xs mt-1" style="color:var(--terracota-300)">${numVentas} ventas registradas</p>
      </div>

      <div class="stat-card olive animate-in-delay-2">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold uppercase tracking-wider" style="color:var(--olive-500)">Ganancia</span>
          <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:var(--olive-50)">
            <i data-lucide="trending-up" class="w-[18px] h-[18px]" style="color:var(--olive-500)"></i>
          </div>
        </div>
        <p class="text-2xl font-bold ${ganancia >= 0 ? 'text-green-700' : 'text-red-600'}">$${ganancia.toLocaleString('es-MX', {minimumFractionDigits: 0})}</p>
        <p class="text-xs mt-1" style="color:var(--terracota-300)">${numVentas > 0 ? ((ganancia / totalVentas) * 100).toFixed(0) : 0}% margen</p>
      </div>

      <div class="stat-card sand animate-in-delay-3">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold uppercase tracking-wider" style="color:var(--terracota-400)">Costos Fijos</span>
          <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:var(--terracota-50)">
            <i data-lucide="receipt" class="w-[18px] h-[18px]" style="color:var(--terracota-400)"></i>
          </div>
        </div>
        <p class="text-2xl font-bold" style="color:var(--charcoal)">$${(perfil?.total_costos_fijos || 0).toLocaleString('es-MX')}</p>
        <p class="text-xs mt-1" style="color:var(--terracota-300)">$${(perfil?.costo_fijo_por_hora || 0)}/hr fijo</p>
      </div>

      <div class="stat-card warm animate-in-delay-3">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold uppercase tracking-wider" style="color:var(--terracota-400)">Catálogo</span>
          <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:var(--terracota-50)">
            <i data-lucide="scissors" class="w-[18px] h-[18px]" style="color:var(--terracota-400)"></i>
          </div>
        </div>
        <p class="text-2xl font-bold" style="color:var(--charcoal)">${perfil?.total_servicios || 0}</p>
        <p class="text-xs mt-1" style="color:var(--terracota-300)">servicios · ${perfil?.total_insumos || 0} insumos</p>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Chart (2 cols) -->
      <div class="lg:col-span-2 card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold" style="color:var(--charcoal)">Ventas Recientes</h3>
          <span class="text-xs" style="color:var(--terracota-300)">Últimos registros</span>
        </div>
        <div style="height:220px"><canvas id="chart-ventas"></canvas></div>
      </div>

      <!-- Servicios (1 col) -->
      <div class="card p-5">
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
          `).join('') || '<p class="text-sm py-4 text-center" style="color:var(--terracota-300)">Sin servicios aún</p>'}
        </div>
      </div>
    </div>

    <!-- Low Stock Alert -->
    ${insumos && insumos.length > 0 ? `
    <div class="card p-5 mt-6">
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
        `).join('') || '<p class="text-sm col-span-full text-center py-2" style="color:var(--olive-500)">Todo con buen stock ✓</p>'}
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
