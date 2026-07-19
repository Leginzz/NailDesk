// ============================================================
// NailDesk — Admin: Dashboard de Ingresos SaaS
// ============================================================

import supabase from '../../supabase.js';

export async function renderAdminIngresos() {
  const content = document.getElementById('page-content');
  content.innerHTML = `<div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-terracota-500"></div></div>`;

  const [susRes, planesRes] = await Promise.all([
    supabase.from('suscripciones').select('*, plan:planes_suscripcion (nombre, slug, precio_mensual)'),
    supabase.from('planes_suscripcion').select('*').eq('activo', true).order('precio_mensual'),
  ]);

  const suscripciones = susRes.data || [];
  const planes = planesRes.data || [];

  // Compute MRR
  const mrr = suscripciones
    .filter(s => s.estado === 'activo' && s.plan?.precio_mensual > 0)
    .reduce((sum, s) => sum + (s.plan.precio_mensual || 0), 0);

  const arr = mrr * 12;

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

  // Conversion rate
  const totalSignedUp = suscripciones.length;
  const paidActive = suscripciones.filter(s => s.estado === 'activo' && s.plan?.precio_mensual > 0).length;
  const conversionRate = totalSignedUp > 0 ? ((paidActive / totalSignedUp) * 100).toFixed(1) : 0;

  content.innerHTML = `
    <div class="space-y-6">
      <!-- KPIs -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div class="w-10 h-10 rounded-xl bg-terracota-50 flex items-center justify-center">
              <i data-lucide="users" class="w-5 h-5 text-terracota-600"></i>
            </div>
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Clientes</span>
          </div>
          <p class="text-3xl font-bold text-gray-900">${totalSignedUp}</p>
          <p class="text-xs text-gray-400 mt-1">${paidActive} de pago activos</p>
        </div>
        <div class="bg-white rounded-xl p-5 border border-gray-100">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <i data-lucide="target" class="w-5 h-5 text-purple-600"></i>
            </div>
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wide">Conversión</span>
          </div>
          <p class="text-3xl font-bold text-gray-900">${conversionRate}%</p>
          <p class="text-xs text-gray-400 mt-1">Trial → Pago activo</p>
        </div>
      </div>

      <!-- Charts row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Revenue by plan -->
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <h4 class="font-semibold text-gray-900 mb-4">Ingresos por Plan</h4>
          <div style="height:250px"><canvas id="chart-revenue-plan"></canvas></div>
        </div>

        <!-- Subscribers by status -->
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <h4 class="font-semibold text-gray-900 mb-4">Suscriptores por Estado</h4>
          <div style="height:250px"><canvas id="chart-status-dist"></canvas></div>
        </div>
      </div>

      <!-- Plan breakdown table -->
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
              </tr>
            </thead>
            <tbody>
              ${planStats.map(p => `
                <tr class="border-b border-gray-50 hover:bg-gray-50/50">
                  <td class="px-4 py-3 font-medium text-gray-900">${p.nombre}</td>
                  <td class="px-4 py-3 text-right text-gray-600">${p.precio_mensual > 0 ? '$' + p.precio_mensual : 'Gratis'}</td>
                  <td class="px-4 py-3 text-right text-gray-600">${p.count}</td>
                  <td class="px-4 py-3 text-right text-green-600 font-medium">${p.activeCount}</td>
                  <td class="px-4 py-3 text-right font-semibold text-terracota-600">${p.mrr > 0 ? '$' + p.mrr.toLocaleString('es-MX') : '—'}</td>
                </tr>
              `).join('')}
              <tr class="bg-gray-50 font-semibold">
                <td class="px-4 py-3 text-gray-900">Total</td>
                <td class="px-4 py-3 text-right text-gray-600">—</td>
                <td class="px-4 py-3 text-right text-gray-900">${totalSignedUp}</td>
                <td class="px-4 py-3 text-right text-green-600">${paidActive}</td>
                <td class="px-4 py-3 text-right text-terracota-600">$${mrr.toLocaleString('es-MX')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  // Charts
  renderRevenueChart(planStats);
  renderStatusChart(statusStats);
}

function renderRevenueChart(planStats) {
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
        y: { beginAtZero: true, ticks: { callback: v => '$' + v } },
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
