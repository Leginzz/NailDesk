// ============================================================
// NailDesk — Admin: Users Management View
// ============================================================

import supabase from '../../supabase.js';
import { showToast } from '../../components/toast.js';

export async function renderAdminUsers() {
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="flex items-center justify-center py-20"><div class="spinner"></div></div>`;

  const [rolesRes, perfilesRes, suscripcionesRes, planesRes] = await Promise.all([
    supabase.from('user_roles').select('*'),
    supabase.from('perfiles_negocio').select('*'),
    supabase.from('suscripciones').select('*'),
    supabase.from('planes_suscripcion').select('*'),
  ]);

  const roles = rolesRes.data || [];
  const perfiles = perfilesRes.data || [];
  const suscripciones = suscripcionesRes.data || [];
  const planes = planesRes.data || [];

  const planeMap = {};
  planes.forEach(p => planeMap[p.id] = p);

  const subMap = {};
  suscripciones.forEach(s => subMap[s.user_id] = s);

  const allUserIds = [...new Set([...roles.map(r => r.user_id), ...perfiles.map(p => p.user_id)])];

  const users = allUserIds.map(uid => {
    const role = roles.find(r => r.user_id === uid);
    const perfil = perfiles.find(p => p.user_id === uid);
    const sub = subMap[uid];
    const plan = sub ? planeMap[sub.plan_id] : null;

    return {
      user_id: uid,
      salon: perfil?.nombre_salon || 'Sin perfil',
      email: perfil?.email || uid.substring(0, 8) + '...',
      role: role?.role || 'user',
      plan: plan?.nombre || 'Sin plan',
      subscription_status: sub?.estado || 'none',
      created_at: role?.created_at || perfil?.created_at,
    };
  });

  const adminCount = users.filter(u => u.role === 'admin').length;

  container.innerHTML = `
    <div class="section-header animate-in">
      <div class="stat-row">
        <p class="text-sm" style="color:var(--terracota-400)">${users.length} usuarios</p>
        <div class="section-divider"></div>
        <p class="text-sm" style="color:var(--terracota-300)">${adminCount} admin${adminCount !== 1 ? 's' : ''}</p>
      </div>
    </div>

    <div class="card overflow-hidden animate-in-delay-1">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Salon</th>
              <th>Usuario ID</th>
              <th>Rol</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td class="font-semibold" style="color:var(--charcoal)">${u.salon}</td>
                <td class="text-xs font-mono" style="color:var(--terracota-400)">${u.user_id.substring(0, 12)}...</td>
                <td>
                  <span class="badge ${u.role === 'admin' ? 'badge-success' : 'badge-info'}">
                    ${u.role === 'admin' ? 'Admin' : 'Usuario'}
                  </span>
                </td>
                <td><span class="badge badge-warning">${u.plan}</span></td>
                <td>
                  <span class="badge ${u.subscription_status === 'activo' ? 'badge-success' : u.subscription_status === 'trial' ? 'badge-info' : 'badge-danger'}">
                    ${u.subscription_status}
                  </span>
                </td>
                <td>
                  <div class="flex gap-1">
                    ${u.role !== 'admin' ? `
                      <button class="btn btn-ghost btn-make-admin text-xs" data-uid="${u.user_id}" title="Hacer admin">
                        <i data-lucide="shield" class="w-4 h-4" style="color:#22c55e"></i>
                      </button>
                    ` : `
                      <button class="btn btn-ghost btn-remove-admin text-xs" data-uid="${u.user_id}" title="Quitar admin">
                        <i data-lucide="shield-off" class="w-4 h-4" style="color:#dc6b4a"></i>
                      </button>
                    `}
                  </div>
                </td>
              </tr>
            `).join('') || `
              <tr>
                <td colspan="6" class="text-center py-12">
                  <div class="empty-state">
                    <i data-lucide="users" class="w-12 h-12 mx-auto mb-3"></i>
                    <p class="font-medium" style="color:var(--terracota-400)">No hay usuarios registrados</p>
                  </div>
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  container.querySelectorAll('.btn-make-admin').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Hacer admin a este usuario?')) return;
      const { error } = await supabase.from('user_roles').upsert({
        user_id: btn.dataset.uid,
        role: 'admin'
      });
      if (error) { showToast('Error: ' + error.message, 'error'); return; }
      showToast('Usuario ahora es admin');
      renderAdminUsers();
    });
  });

  container.querySelectorAll('.btn-remove-admin').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Quitar permisos de admin a este usuario?')) return;
      const { error } = await supabase.from('user_roles').update({ role: 'user' }).eq('user_id', btn.dataset.uid);
      if (error) { showToast('Error: ' + error.message, 'error'); return; }
      showToast('Permisos de admin removidos');
      renderAdminUsers();
    });
  });
}
