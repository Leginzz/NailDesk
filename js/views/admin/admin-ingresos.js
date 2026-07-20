// ============================================================
// NailDesk — Admin: Dashboard de Ingresos SaaS (mejorado)
// ============================================================

import supabase from '../../supabase.js';

export async function renderAdminIngresos() {
  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-terracota-500"></div></div>`;

  const [susRes, planesRes, perfilesRes] = await Promise.all([
    supabase.from('suscripciones').select('*, plan:planes_suscripcion (nombre, slug, precio_mensual)'),
    supabase.from('planes_suscripcion').select('*').eq('activo', true).order('precio_mensual'),
    supabase.from('perfiles_negocio').select('user_id, nombre_salon'),
  ]);

  const suscripciones = susRes.data || [];
  const planes = planesRes.data || [];
  const perfiles = perfilesRes.data || [];
  const perfilMap = {};
  perfiles.forEach(p => { perfilMap[p.user_id] = p.nombre_salon; });

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

  // MRR
  const mrr = suscripciones
    .filter(s => s.estado === 'activo' && s.plan?.precio_mensual > 0)
    .reduce((sum, s) => sum + (s.plan.precio_mensual || 0), 0);
  const arr = mrr * 12;

  // Clientes
  const totalSignedUp = suscripciones.length;
  const paidActive = suscripciones.filter(s => s.estado === 'activo' && s.plan?.precio_mensual > 0).length;
  const conversionRate = totalSignedUp > 0 ? ((paidActive / totalSignedUp) * 100).toFixed(1) : 0;

  // Ticket promedio
  const ticketProm = paidActive > 0 ? mrr / paidActive : 0;

  // Churn rate (cancelados o suspendidos / total)
  const cancelledOrSuspended = suscripciones.filter(s => ['cancelado', 'suspendido'].includes(s.estado)).length;
  const churnRate = totalSignedUp > 0 ? ((cancelledOrSuspended / totalSignedUp) * 100).toFixed(1) : 0;

  // Nuevos este mes vs mes anterior
  const newThisMonth = suscripciones.filter(s => s.created_at && s.created_at.startsWith(thisMonth)).length;
  const newLastMonth = suscripciones.filter(s => s.created_at && s.created_at.startsWith(lastMonthKey)).length;
  const newTrend = newThisMonth - newLastMonth;

  // Cancelados este mes vs mes anterior
  const cancelledThisMonth = suscripciones.filter(s =>
    s.updated_at && s.updated_at.startsWith(thisMonth) && s.estado === 'cancelado'
  ).length;
  const cancelledLastMonth = suscripciones.filter(s =>
    s.updated_at && s.updated_at.startsWith(lastMonthKey) && s.estado === 'cancelado'
  ).length;
  const cancelledTrend = cancelledThisMonth - cancelledLastMonth;

  // By plan
  const planStats = planes.map(p => ({
    ...p,
    count: suscripciones.filter(s => s.plan_id === p.id).length,
    activeCount: suscripciones.filter(s => s.plan_id === p.id && s.estado === 'activo').length,
    mrr: suscripciones.filter(s => s.plan_id === p.id && s.estado === 'activo').reduce((sum, s) => sum + (p.precio_mensual || 0), 0),
  }));

  // By status
  const statusStats = {
    activo: suscripciones.filter(s => s.estado === 'activo').length,
    trial: suscripciones.filter(s => s.estado === 'trial').length,
    suspendido: suscripciones.filter(s => s.estado === 'suspendido').length,
    cancelado: suscripciones.filter(s => s.estado === 'cancelado').length,
  };

  // Monthly trend (last 6 months)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
    const activeInMonth = suscripciones.filter(s =>
      s.estado === 'activo' &&
      s.plan?.precio_mensual > 0 &&
      s.created_at && s.created_at <= key + '-31' &&
      (!s.updated_at || s.updated_at > key + '-01' || s.estado !== 'cancelado')
    );
    const mrrMonth = activeInMonth.reduce((sum, s) => sum + (s.plan?.precio_mensual || 0), 0);
    monthlyTrend.push({ key, label, mrr: mrrMonth });
  }

  // Top salones (by subscription value)
  const topSalones = suscripciones
    .filter(s => s.estado === 'activo' && s.plan?.precio_mensual > 0)
    .map(s => ({
      nombre: perfilMap[s.user_id] || 'Sin nombre',
      plan: s.plan?.nombre || '-',
      monto: s.plan?.precio_mensual || 0,
      desde: s.fecha_inicio,
    }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 5);

  content.innerHTML = `
    <div class="space-y-6">

      <!-- KPIs Principales -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <i data-lucide="dollar-sign" class="w-5 h-5 text-green-600"></i>
            </div>
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">MRR</span>
          </div>
          <p class="text-3xl font-bold text-gray-900">$${mrr.toLocaleString('es-MX')}</p>
          <p class="text-xs text-gray-400 mt-1">Ingresos recurrentes mensuales</p>
        </div>
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <i data-lucide="calendar" class="w-5 h-5 text-blue-600"></i>
            </div>
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">ARR</span>
          </div>
          <p class="text-3xl font-bold text-gray-900">$${arr.toLocaleString('es-MX')}</p>
          <p class="text-xs text-gray-400 mt-1">Ingresos recurrentes anuales</p>
        </div>
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <i data-lucide="receipt" class="w-5 h-5 text-amber-600"></i>
            </div>
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Ticket Prom.</span>
          </div>
          <p class="text-3xl font-bold text-gray-900">$${ticketProm.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <p class="text-xs text-gray-400 mt-1">MRR / clientes activos de pago</p>
        </div>
      </div>

      <!-- KPIs Secundarios -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-4 border border-gray-100">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <i data-lucide="users" class="w-4 h-4 text-purple-600"></i>
            </div>
            <span class="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Clientes</span>
          </div>
          <p class="text-2xl font-bold text-gray-900">${totalSignedUp}</p>
          <p class="text-xs text-gray-400">${paidActive} de pago activos</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <i data-lucide="target" class="w-4 h-4 text-indigo-600"></i>
            </div>
            <span class="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Conversión</span>
          </div>
          <p class="text-2xl font-bold text-gray-900">${conversionRate}%</p>
          <p class="text-xs text-gray-400">Trial → Pago activo</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <i data-lucide="user-plus" class="w-4 h-4 text-emerald-600"></i>
            </div>
            <span class="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Nuevos (Mes)</span>
          </div>
          <div class="flex items-baseline gap-2">
            <p class="text-2xl font-bold text-gray-900">${newThisMonth}</p>
            ${newTrend !== 0 ? `<span class="text-xs font-semibold ${newTrend > 0 ? 'text-green-600' : 'text-red-500'}">${newTrend > 0 ? '+' : ''}${newTrend}</span>` : ''}
          </div>
          <p class="text-xs text-gray-400">vs ${newLastMonth} mes anterior</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <i data-lucide="user-minus" class="w-4 h-4 text-red-500"></i>
            </div>
            <span class="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Churn Rate</span>
          </div>
          <div class="flex items-baseline gap-2">
            <p class="text-2xl font-bold text-gray-900">${churnRate}%</p>
            ${cancelledTrend !== 0 ? `<span class="text-xs font-semibold ${cancelledTrend > 0 ? 'text-red-500' : 'text-green-600'}">${cancelledTrend > 0 ? '+' : ''}${cancelledTrend}</span>` : ''}
          </div>
          <p class="text-xs text-gray-400">${cancelledOrSuspended} total cancelados/suspendidos</p>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Tendencia MRR -->
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <h4 class="font-semibold text-gray-900 mb-4">Tendencia MRR (6 meses)</h4>
          <div style="height:250px"><canvas id="chart-mrr-trend"></canvas></div>
        </div>

        <!-- Distribución por plan -->
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <h4 class="font-semibold text-gray-900 mb-4">Ingresos por Plan</h4>
          <div style="height:250px"><canvas id="chart-revenue-plan"></canvas></div>
        </div>

        <!-- Suscriptores por estado -->
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <h4 class="font-semibold text-gray-900 mb-4">Suscriptores por Estado</h4>
          <div style="height:250px"><canvas id="chart-status-dist"></canvas></div>
        </div>

        <!-- Top salones -->
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <h4 class="font-semibold text-gray-900 mb-4">Top Salones</h4>
          <div style="height:250px"><canvas id="chart-top-salones"></canvas></div>
        </div>
      </div>

      <!-- Tabla desglose -->
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div class="p-4 border-b border-gray-100">
          <h4 class="font-semibold text-gray-900">Desglose por Plan</h4>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50">
                <th class="text-left px-4 py-3 font-medium text-gray-500">Plan</th>
                <th class="text-right px-4 py-3 font-medium text-gray-500">Precio</th>
                <th class="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                <th class="text-right px-4 py-3 font-medium text-gray-500">Activos</th>
                <th class="text-right px-4 py-3 font-medium text-gray-500">MRR</th>
                <th class="text-right px-4 py-3 font-medium text-gray-500">% del MRR</th>
              </tr>
            </thead>
            <tbody>
              ${planStats.map(p => `
                <tr class="border-b border-gray-50 hover:bg-gray-50/50">
                  <td class="px-4 py-3 font-medium text-gray-900">${p.nombre}</td>
                  <td class="px-4 py-3 text-right text-gray-600">${p.precio_mensual > 0 ? '$' + p.precio_mensual.toLocaleString('es-MX') : 'Gratis'}</td>
                  <td class="px-4 py-3 text-right text-gray-600">${p.count}</td>
                  <td class="px-4 py-3 text-right text-green-600 font-medium">${p.activeCount}</td>
                  <td class="px-4 py-3 text-right font-semibold text-terracota-600">${p.mrr > 0 ? '$' + p.mrr.toLocaleString('es-MX') : '—'}</td>
                  <td class="px-4 py-3 text-right text-gray-500">${mrr > 0 ? ((p.mrr / mrr) * 100).toFixed(1) + '%' : '—'}</td>
                </tr>
              `).join('')}
              <tr class="bg-gray-50 font-semibold">
                <td class="px-4 py-3 text-gray-900">Total</td>
                <td class="px-4 py-3 text-right text-gray-600">—</td>
                <td class="px-4 py-3 text-right text-gray-900">${totalSignedUp}</td>
                <td class="px-4 py-3 text-right text-green-600">${paidActive}</td>
                <td class="px-4 py-3 text-right text-terracota-600">$${mrr.toLocaleString('es-MX')}</td>
                <td class="px-4 py-3 text-right text-gray-900">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  renderMrrTrendChart(monthlyTrend);
  renderRevenueChart(planStats, mrr);
  renderStatusChart(statusStats);
  renderTopSalonesChart(topSalones);
}

function renderMrrTrendChart(monthlyTrend) {
  const ctx = document.getElementById('chart-mrr-trend');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthlyTrend.map(m => m.label),
      datasets: [{
        label: 'MRR ($)',
        data: monthlyTrend.map(m => m.mrr),
        borderColor: '#A0607A',
        backgroundColor: 'rgba(160, 96, 122, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#A0607A',
        pointRadius: 5,
        pointHoverRadius: 7,
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

function renderRevenueChart(planStats, totalMrr) {
  const ctx = document.getElementById('chart-revenue-plan');
  if (!ctx) return;

  const activePlans = planStats.filter(p => p.mrr > 0 || p.precio_mensual > 0);
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: activePlans.map(p => p.nombre),
      datasets: [{
        label: 'MRR ($)',
        data: activePlans.map(p => p.mrr),
        backgroundColor: ['#A0607A', '#8BA888', '#C994A1'],
        borderRadius: 8,
        barThickness: 40,
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

function renderStatusChart(statusStats) {
  const ctx = document.getElementById('chart-status-dist');
  if (!ctx) return;

  const labels = ['Activo', 'Trial', 'Suspendido', 'Cancelado'];
  const data = [statusStats.activo, statusStats.trial, statusStats.suspendido, statusStats.cancelado];
  const colors = ['#22C55E', '#3B82F6', '#EF4444', '#9CA3AF'];

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 0 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } }
      },
      cutout: '65%'
    }
  });
}

function renderTopSalonesChart(topSalones) {
  const ctx = document.getElementById('chart-top-salones');
  if (!ctx || !topSalones.length) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: topSalones.map(s => s.nombre.length > 16 ? s.nombre.slice(0, 14) + '...' : s.nombre),
      datasets: [{
        label: 'Mensual ($)',
        data: topSalones.map(s => s.monto),
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
