// ============================================================
// NailDesk — Sidebar Component (dynamic nav by modules)
// ============================================================

import AppState from '../services/app-state.js';

const ALL_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', clave: 'dashboard' },
  { id: 'cotizador', label: 'Cotizador', icon: 'calculator', clave: 'cotizador' },
  { id: 'servicios', label: 'Servicios', icon: 'scissors', clave: 'servicios' },
  { id: 'insumos', label: 'Insumos', icon: 'package', clave: 'insumos' },
  { id: 'costos-fijos', label: 'Costos Fijos', icon: 'receipt', clave: 'costos-fijos' },
  { id: 'equipo', label: 'Equipo', icon: 'wrench', clave: 'equipo' },
  { id: 'extras', label: 'Extras', icon: 'plus-circle', clave: 'extras' },
  { id: 'ventas', label: 'Ventas', icon: 'shopping-cart', clave: 'ventas' },
  { id: 'configuracion', label: 'Configuración', icon: 'settings', clave: 'configuracion' },
];

const ADMIN_ITEMS = [
  { id: 'admin-salones', label: 'Salones', icon: 'building-2' },
  { id: 'admin-suscripciones', label: 'Suscripciones', icon: 'credit-card' },
  { id: 'admin-planes', label: 'Planes', icon: 'layers' },
  { id: 'admin-ingresos', label: 'Ingresos SaaS', icon: 'trending-up' },
];

function getNavItems() {
  if (AppState.isAdmin) return ALL_NAV_ITEMS;
  return ALL_NAV_ITEMS.filter(item => AppState.isModuleEnabled(item.clave));
}

export function renderSidebar(currentView) {
  const nav = document.getElementById('sidebar-nav');
  const items = getNavItems();

  let html = items.map(item => `
    <a href="#/${item.id}" class="nav-item ${currentView === item.id ? 'active' : ''}" data-view="${item.id}">
      <i data-lucide="${item.icon}" class="w-[18px] h-[18px]"></i>
      <span>${item.label}</span>
    </a>
  `).join('');

  if (AppState.isAdmin) {
    html += `
      <div class="pt-3 mt-3 border-t border-white/10">
        <p class="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/30">Admin</p>
        ${ADMIN_ITEMS.map(item => `
          <a href="#/${item.id}" class="nav-item ${currentView === item.id ? 'active' : ''}" data-view="${item.id}">
            <i data-lucide="${item.icon}" class="w-[18px] h-[18px]"></i>
            <span>${item.label}</span>
          </a>
        `).join('')}
      </div>
    `;
  }

  nav.innerHTML = html;

  if (window.lucide) lucide.createIcons();
}

export function updateSalonName(name) {
  const el = document.getElementById('sidebar-salon-name');
  if (el) el.textContent = name || 'Mi Salón';
}

export function updateUserEmail(email) {
  const el = document.getElementById('sidebar-user-email');
  if (el) el.textContent = email || '';
}

// Mobile toggle
document.getElementById('btn-toggle-sidebar')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('active');
});

// Close sidebar on overlay click
document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');
});

// Close sidebar on nav click (mobile)
document.getElementById('sidebar-nav')?.addEventListener('click', (e) => {
  if (e.target.closest('.nav-item')) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('active');
  }
});

export { ALL_NAV_ITEMS, ADMIN_ITEMS };
