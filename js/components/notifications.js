// ============================================================
// NailDesk — Notifications Bell Component (admin only)
// ============================================================

import supabase from '../supabase.js';
import AppState from '../services/app-state.js';

let notifOpen = false;

export async function loadNotifications() {
  if (!AppState.isAdmin) return;

  const { count } = await supabase
    .from('notificaciones')
    .select('*', { count: 'exact', head: true })
    .eq('leido', false);

  updateBadge(count || 0);
}

function updateBadge(count) {
  const badge = document.getElementById('notif-badge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 9 ? '9+' : count;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

async function toggleDropdown() {
  const dropdown = document.getElementById('notif-dropdown');
  if (!dropdown) return;

  notifOpen = !notifOpen;

  if (notifOpen) {
    dropdown.classList.remove('hidden');
    await renderNotifications();
  } else {
    dropdown.classList.add('hidden');
  }
}

async function renderNotifications() {
  const list = document.getElementById('notif-list');
  if (!list) return;

  list.innerHTML = '<div class="p-4 text-center text-sm text-gray-400">Cargando...</div>';

  const { data } = await supabase
    .from('notificaciones')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (!data || data.length === 0) {
    list.innerHTML = '<div class="p-6 text-center text-sm text-gray-400">Sin notificaciones</div>';
    return;
  }

  list.innerHTML = data.map(n => `
    <div class="notif-item px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${n.leido ? 'opacity-60' : ''}" data-notif-id="${n.id}">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-lg ${n.tipo === 'nuevo_registro' ? 'bg-green-50' : 'bg-terracota-50'} flex items-center justify-center flex-shrink-0 mt-0.5">
          <i data-lucide="${n.tipo === 'nuevo_registro' ? 'user-plus' : 'bell'}" class="w-4 h-4 ${n.tipo === 'nuevo_registro' ? 'text-green-600' : 'text-terracota-600'}"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900">${n.titulo}</p>
          <p class="text-xs text-gray-500 mt-0.5 truncate">${n.mensaje || ''}</p>
          <p class="text-[11px] text-gray-400 mt-1">${formatTime(n.created_at)}</p>
        </div>
        ${!n.leido ? '<div class="w-2 h-2 rounded-full bg-terracota-500 flex-shrink-0 mt-2"></div>' : ''}
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();

  // Click to mark as read
  list.querySelectorAll('.notif-item').forEach(el => {
    el.addEventListener('click', async () => {
      const id = el.dataset.notifId;
      await supabase.from('notificaciones').update({ leido: true }).eq('id', id);
      el.classList.add('opacity-60');
      const dot = el.querySelector('.bg-terracota-500');
      if (dot) dot.remove();
      await loadNotifications();
    });
  });
}

function formatTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Hace ${days}d`;
}

export function initNotifications() {
  const btn = document.getElementById('btn-notifications');
  const dropdown = document.getElementById('notif-dropdown');
  if (!btn || !dropdown) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
      notifOpen = false;
      dropdown.classList.add('hidden');
    }
  });

  // Mark all as read
  document.getElementById('btn-mark-all-read')?.addEventListener('click', async () => {
    await supabase.from('notificaciones').update({ leido: true }).eq('leido', false);
    await renderNotifications();
    await loadNotifications();
  });

  loadNotifications();

  // Refresh every 30s
  setInterval(loadNotifications, 30000);
}
