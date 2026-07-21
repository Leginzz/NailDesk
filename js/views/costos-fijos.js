// ============================================================
// NailDesk — Costos Fijos View
// ============================================================

import supabase from '../supabase.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { exportWithHeaders } from '../utils/export-excel.js';

export async function renderCostosFijos() {
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="flex items-center justify-center py-20"><div class="spinner"></div></div>`;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: costos } = await supabase.from('costos_fijos').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  const total = costos?.filter(c => c.activo).reduce((s, c) => s + Number(c.costo_mensual), 0) || 0;

  const iconMap = { 'Renta': 'home', 'Luz': 'zap', 'Agua': 'droplets', 'Internet': 'wifi', 'Publicidad': 'megaphone' };

  container.innerHTML = `
    <div class="section-header animate-in">
      <div class="stat-row">
        <p class="text-sm" style="color:var(--terracota-400)">${costos?.length || 0} conceptos</p>
        <div class="section-divider"></div>
        <p class="text-sm font-semibold" style="color:var(--charcoal)">Total: <span style="color:var(--terracota-500)">$${total.toLocaleString('es-MX')}/mes</span></p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-secondary" id="btn-export-costos"><i data-lucide="download" class="w-4 h-4"></i> Excel</button>
        <button class="btn btn-primary" id="btn-add-costo"><i data-lucide="plus" class="w-4 h-4"></i> Nuevo Costo</button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in-delay-1">
      ${costos?.map(c => {
        const icon = Object.keys(iconMap).find(k => c.concepto.includes(k));
        return `
        <div class="card p-5 relative group">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:var(--terracota-50)">
              <i data-lucide="${iconMap[icon] || 'circle-dollar-sign'}" class="w-5 h-5" style="color:var(--terracota-400)"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wider" style="color:var(--terracota-400)">${c.concepto}</p>
              <p class="text-xl font-bold mt-1" style="color:var(--charcoal)">$${Number(c.costo_mensual).toLocaleString('es-MX')}</p>
            </div>
          </div>
          <div class="flex gap-2 mt-3 pt-3 border-t" style="border-color:var(--terracota-50)">
            <button class="btn btn-ghost btn-edit-costo text-xs" data-id="${c.id}" style="padding:0.25rem 0.5rem"><i data-lucide="pencil" class="w-3.5 h-3.5"></i> Editar</button>
            <button class="btn btn-ghost btn-delete-costo text-xs" data-id="${c.id}" style="padding:0.25rem 0.5rem"><i data-lucide="trash-2" class="w-3.5 h-3.5" style="color:#dc6b4a"></i></button>
          </div>
        </div>`;
      }).join('') || `
        <div class="col-span-full empty-state"><i data-lucide="receipt" class="w-12 h-12 mx-auto mb-3"></i><p class="font-medium" style="color:var(--terracota-400)">No hay costos fijos</p></div>
      `}
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  document.getElementById('btn-add-costo').addEventListener('click', () => openCostoModal());

  document.getElementById('btn-export-costos')?.addEventListener('click', () => {
    if (!costos?.length) { showToast('No hay datos para exportar', 'error'); return; }
    exportWithHeaders(costos, 'NailDesk-CostosFijos', {
      'Concepto': 'concepto',
      'Costo Mensual': 'costo_mensual',
      'Activo': 'activo'
    }, { widths: { 'Concepto': 25, 'Costo Mensual': 15, 'Activo': 10 } });
    showToast('Archivo Excel descargado');
  });

  container.querySelectorAll('.btn-edit-costo').forEach(btn => {
    btn.addEventListener('click', () => { const c = costos.find(x => x.id === btn.dataset.id); if (c) openCostoModal(c); });
  });

  container.querySelectorAll('.btn-delete-costo').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este costo?')) return;
      await supabase.from('costos_fijos').delete().eq('id', btn.dataset.id);
      showToast('Costo eliminado'); renderCostosFijos();
    });
  });
}

function openCostoModal(costo = null) {
  const isEdit = !!costo;
  openModal(`
    <form id="costo-form" class="space-y-4">
      <div><label class="form-label">Concepto</label><input type="text" id="c-concepto" class="form-input" value="${costo?.concepto || ''}" required placeholder="Ej: Renta del local"></div>
      <div><label class="form-label">Costo mensual</label><input type="number" step="0.01" id="c-monto" class="form-input" value="${costo?.costo_mensual || 0}" required></div>
      <div class="flex gap-3 pt-2">
        <button type="button" class="btn btn-secondary flex-1" onclick="document.getElementById('modal-close-btn').click()">Cancelar</button>
        <button type="submit" class="btn btn-primary flex-1">${isEdit ? 'Guardar' : 'Crear'}</button>
      </div>
    </form>
  `, { title: isEdit ? 'Editar Costo' : 'Nuevo Costo Fijo' });

  document.getElementById('costo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = { concepto: document.getElementById('c-concepto').value, costo_mensual: Number(document.getElementById('c-monto').value) };
    if (isEdit) { await supabase.from('costos_fijos').update(data).eq('id', costo.id); showToast('Costo actualizado'); }
    else { await supabase.from('costos_fijos').insert(data); showToast('Costo creado'); }
    closeModal(); renderCostosFijos();
  });
}
