// ============================================================
// NailDesk — Upgrade Banner Component
// Shows for Free plan users, configurable from admin
// Reappears every 48 hours after dismissal
// ============================================================

import supabase from '../supabase.js';
import AppState from '../services/app-state.js';

const DISMISS_KEY = 'naildesk_banner_dismissed';
const DISMISS_INTERVAL = 48 * 60 * 60 * 1000; // 48 hours

function wasDismissedRecently() {
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  return (Date.now() - parseInt(dismissed)) < DISMISS_INTERVAL;
}

function dismissBanner() {
  localStorage.setItem(DISMISS_KEY, Date.now().toString());
  const banner = document.getElementById('upgrade-banner');
  if (banner) banner.remove();
}

export async function renderUpgradeBanner(container) {
  // Skip for admins
  if (AppState.isAdmin) return;

  // Skip if dismissed recently
  if (wasDismissedRecently()) return;

  // Only for Free plan users
  if (AppState.plan?.slug !== 'free' && AppState.plan !== null) return;

  const { data: config } = await supabase
    .from('banner_config')
    .select('*')
    .eq('activo', true)
    .maybeSingle();

  if (!config) return;

  const whatsappUrl = `https://wa.me/${config.whatsapp_numero}?text=${encodeURIComponent('Hola, me interesa mejorar mi plan de NailDesk')}`;

  const bannerHtml = `
    <div id="upgrade-banner" class="mb-6 bg-gradient-to-r from-terracota-500 to-terracota-600 rounded-2xl p-5 text-white relative animate-in">
      <button id="dismiss-banner" class="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/20 transition-colors" title="Cerrar">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <i data-lucide="lock" class="w-5 h-5"></i>
        </div>
        <div class="flex-1">
          <h3 class="font-display text-lg font-bold">${config.titulo}</h3>
          <p class="text-sm text-white/80 mt-1">${config.mensaje}</p>
        </div>
        <div class="flex gap-2 flex-shrink-0">
          <a href="${whatsappUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 bg-white text-terracota-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors">
            <i data-lucide="message-circle" class="w-4 h-4"></i>
            ${config.cta_texto}
          </a>
        </div>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('afterbegin', bannerHtml);

  if (window.lucide) lucide.createIcons();

  document.getElementById('dismiss-banner')?.addEventListener('click', dismissBanner);
}
