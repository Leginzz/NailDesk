// ============================================================
// NailDesk — Main App (SPA Router + Admin + Block Screen)
// ============================================================

import { initAuth } from './auth.js';
import { renderSidebar, updateSalonName, updateUserEmail } from './components/sidebar.js';
import AppState from './services/app-state.js';
import supabase from './supabase.js';

import { renderDashboard } from './views/dashboard.js';
import { renderServicios } from './views/servicios.js';
import { renderInsumos } from './views/insumos.js';
import { renderCostosFijos } from './views/costos-fijos.js';
import { renderEquipo } from './views/equipo.js';
import { renderExtras } from './views/extras.js';
import { renderVentas } from './views/ventas.js';
import { renderConfiguracion } from './views/configuracion.js';
import { renderCotizador } from './views/cotizador.js';

const USER_ROUTES = {
  'dashboard': { title: 'Dashboard', render: renderDashboard },
  'cotizador': { title: 'Cotizador', render: renderCotizador },
  'servicios': { title: 'Servicios', render: renderServicios },
  'insumos': { title: 'Insumos', render: renderInsumos },
  'costos-fijos': { title: 'Costos Fijos', render: renderCostosFijos },
  'equipo': { title: 'Equipo y Herramientas', render: renderEquipo },
  'extras': { title: 'Extras y Adicionales', render: renderExtras },
  'ventas': { title: 'Registro de Ventas', render: renderVentas },
  'configuracion': { title: 'Configuración', render: renderConfiguracion },
};

const ADMIN_ROUTES = {
  'admin-salones': { title: 'Gestión de Salones', render: () => import('./views/admin/admin-salones.js').then(m => m.renderAdminSalones()) },
  'admin-planes': { title: 'Planes de Suscripción', render: () => import('./views/admin/admin-planes.js').then(m => m.renderAdminPlanes()) },
  'admin-suscripciones': { title: 'Suscripciones', render: () => import('./views/admin/admin-suscripciones.js').then(m => m.renderAdminSuscripciones()) },
  'admin-ingresos': { title: 'Ingresos SaaS', render: () => import('./views/admin/admin-ingresos.js').then(m => m.renderAdminIngresos()) },
};

const ALL_ROUTES = { ...USER_ROUTES, ...ADMIN_ROUTES };

let currentView = null;

function showBlockScreen() {
  const blockScreen = document.getElementById('block-screen');
  const msg = document.getElementById('block-screen-msg');
  const sub = AppState.subscription;
  if (msg) {
    const isCancelled = sub?.estado === 'cancelado';
    msg.textContent = isCancelled
      ? 'Tu suscripción ha sido cancelada. Contacta al administrador para reactivar tu cuenta.'
      : 'Tu suscripción ha sido suspendida. Contacta al administrador para reactivar tu cuenta.';
  }
  blockScreen?.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

async function navigate(viewId) {
  if (AppState.isBlocked) {
    showBlockScreen();
    return;
  }

  const route = ALL_ROUTES[viewId];
  if (!route) { navigate('dashboard'); return; }

  if (!AppState.isAdmin && viewId.startsWith('admin-')) {
    navigate('dashboard');
    return;
  }

  currentView = viewId;
  document.getElementById('page-title').textContent = route.title;
  renderSidebar(viewId);

  if (window.location.hash !== `#/${viewId}`) {
    history.pushState(null, '', `#/${viewId}`);
  }

  await route.render();
}

function getHashView() {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  return hash || 'dashboard';
}

window.addEventListener('hashchange', () => {
  const view = getHashView();
  if (view !== currentView) navigate(view);
});

window.addEventListener('auth:ready', async (e) => {
  const user = e.detail.user;
  updateUserEmail(user.email);

  // Set header date
  const dateEl = document.getElementById('header-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // Load app state (role, subscription, modules)
  await AppState.load(user.id);

  const { data: perfil } = await supabase.from('perfiles_negocio').select('nombre_salon').single();
  updateSalonName(perfil?.nombre_salon || 'Mi Salón');

  navigate(getHashView());
});

window.addEventListener('perfil:updated', (e) => {
  updateSalonName(e.detail.nombre_salon);
});

if (window.lucide) lucide.createIcons();

initAuth();
