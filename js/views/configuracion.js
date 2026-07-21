// ============================================================
// NailDesk — Configuración View
// ============================================================

import supabase from '../supabase.js';
import { showToast } from '../components/toast.js';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export async function renderConfiguracion() {
  const container = document.getElementById('page-content');
  container.innerHTML = `<div class="flex items-center justify-center py-20"><div class="spinner"></div></div>`;

  const perfilRes = await supabase.from('perfiles_negocio').select('*').single();
  const { data: horarios } = await supabase.from('horario_negocio').select('*').order('dia_semana');
  const perfil = perfilRes.data;
  console.log('perfil load:', perfilRes);

  // Fill missing days
  const horarioMap = {};
  horarios?.forEach(h => horarioMap[h.dia_semana] = h);

  container.innerHTML = `
    <form id="config-form" class="max-w-3xl animate-in">

      <!-- Datos del Salón -->
      <div class="config-section">
        <h3><i data-lucide="store" class="w-4 h-4"></i> Datos del Salón</h3>
        <div class="space-y-4">
          <div><label class="form-label">Nombre del salón</label><input type="text" id="cfg-nombre" class="form-input" value="${perfil?.nombre_salon || ''}" required></div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="form-label">Teléfono</label><input type="text" id="cfg-telefono" class="form-input" value="${perfil?.telefono || ''}" placeholder="Opcional"></div>
            <div><label class="form-label">Email</label><input type="email" id="cfg-email" class="form-input" value="${perfil?.email_contacto || ''}" placeholder="Opcional"></div>
          </div>
          <div><label class="form-label">Dirección</label><input type="text" id="cfg-direccion" class="form-input" value="${perfil?.direccion || ''}" placeholder="Opcional"></div>
        </div>
      </div>

      <!-- Tarifas -->
      <div class="config-section">
        <h3><i data-lucide="calculator" class="w-4 h-4"></i> Tarifas y Costos</h3>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="form-label">Moneda</label>
            <select id="cfg-moneda" class="form-input">
              <option value="MXN" ${perfil?.moneda === 'MXN' ? 'selected' : ''}>MXN — Peso Mexicano</option>
              <option value="USD" ${perfil?.moneda === 'USD' ? 'selected' : ''}>USD — Dólar</option>
              <option value="COP" ${perfil?.moneda === 'COP' ? 'selected' : ''}>COP — Peso Colombiano</option>
              <option value="ARS" ${perfil?.moneda === 'ARS' ? 'selected' : ''}>ARS — Peso Argentino</option>
            </select>
          </div>
          <div><label class="form-label">Mano de obra ($/hr)</label><input type="number" step="0.01" id="cfg-tarifa" class="form-input" value="${perfil?.tarifa_mano_obra_hora || 120}"></div>
          <div><label class="form-label">Horas/mes</label><input type="number" id="cfg-horas" class="form-input" value="${perfil?.horas_trabajo_mes || 144}"></div>
        </div>
        <p class="text-xs mt-3" style="color:var(--terracota-300)">La tarifa se usa para calcular el costo de mano de obra en cada servicio.</p>
      </div>

      <!-- Horarios -->
      <div class="config-section">
        <h3><i data-lucide="clock" class="w-4 h-4"></i> Horarios del Negocio</h3>
        <p class="text-xs mb-4" style="color:var(--terracota-300)">Configura los días y horas de atención de tu salón.</p>
        <div id="horarios-container">
          ${DIAS.map((dia, i) => {
            const h = horarioMap[i];
            const activo = h?.activo ?? (i >= 1 && i <= 6);
            const apertura = h?.hora_apertura?.substring(0, 5) || '09:00';
            const cierre = h?.hora_cierre?.substring(0, 5) || '19:00';
            return `
              <div class="day-row" data-dia="${i}">
                <div class="toggle ${activo ? 'active' : ''}" data-dia="${i}"></div>
                <span class="day-name">${dia}</span>
                <div class="hours ${activo ? '' : 'opacity-30 pointer-events-none'}">
                  <input type="time" value="${apertura}" class="form-input" style="width:120px; padding:0.375rem 0.5rem; font-size:0.8125rem" data-field="apertura" data-dia="${i}">
                  <span style="color:var(--terracota-300)">a</span>
                  <input type="time" value="${cierre}" class="form-input" style="width:120px; padding:0.375rem 0.5rem; font-size:0.8125rem" data-field="cierre" data-dia="${i}">
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Logo / Branding -->
      <div class="config-section">
        <h3><i data-lucide="image" class="w-4 h-4"></i> Logo / Branding</h3>
        <p class="text-xs mb-4" style="color:var(--terracota-300)">Personaliza la apariencia de tu salón. El logo se mostrará en reportes y cotizaciones.</p>
        <div class="flex items-center gap-6">
          <div class="w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center flex-shrink-0" style="border-color:var(--terracota-200); background:var(--sand-50)" id="logo-preview">
            <i data-lucide="image-plus" class="w-8 h-8" style="color:var(--terracota-300)"></i>
          </div>
          <div>
            <p class="text-sm font-medium mb-2" style="color:var(--charcoal)">Subir logo</p>
            <p class="text-xs mb-3" style="color:var(--terracota-300)">PNG o JPG, max 2MB. Se redimensionará a 200×200px.</p>
            <input type="file" id="cfg-logo" accept="image/png,image/jpeg" class="hidden">
            <button type="button" class="btn btn-secondary text-xs" onclick="document.getElementById('cfg-logo').click()">
              <i data-lucide="upload" class="w-3.5 h-3.5"></i> Seleccionar imagen
            </button>
          </div>
        </div>
      </div>

      <!-- Exportar Datos -->
      <div class="config-section">
        <h3><i data-lucide="download" class="w-4 h-4"></i> Exportar Datos</h3>
        <p class="text-xs mb-4" style="color:var(--terracota-300)">Descarga tus datos en formato CSV para análisis externo o respaldo.</p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button type="button" class="btn btn-secondary" id="export-ventas">
            <i data-lucide="download" class="w-4 h-4"></i> Ventas (CSV)
          </button>
          <button type="button" class="btn btn-secondary" id="export-insumos">
            <i data-lucide="download" class="w-4 h-4"></i> Insumos (CSV)
          </button>
          <button type="button" class="btn btn-secondary" id="export-costos">
            <i data-lucide="download" class="w-4 h-4"></i> Costos Fijos (CSV)
          </button>
        </div>
      </div>

      <!-- Guardar -->
      <div class="flex justify-end">
        <button type="submit" class="btn btn-primary"><i data-lucide="save" class="w-4 h-4"></i> Guardar Cambios</button>
      </div>
    </form>
  `;

  if (window.lucide) lucide.createIcons();

  // Toggle handlers for horarios
  container.querySelectorAll('.toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      const dia = toggle.dataset.dia;
      const row = container.querySelector(`.day-row[data-dia="${dia}"]`);
      const hours = row.querySelector('.hours');
      if (toggle.classList.contains('active')) {
        hours.classList.remove('opacity-30', 'pointer-events-none');
      } else {
        hours.classList.add('opacity-30', 'pointer-events-none');
      }
    });
  });

  // Save form
  document.getElementById('config-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const perfilData = {
      nombre_salon: document.getElementById('cfg-nombre').value,
      telefono: document.getElementById('cfg-telefono').value || null,
      email_contacto: document.getElementById('cfg-email').value || null,
      direccion: document.getElementById('cfg-direccion').value || null,
      moneda: document.getElementById('cfg-moneda').value,
      tarifa_mano_obra_hora: Number(document.getElementById('cfg-tarifa').value),
      horas_trabajo_mes: Number(document.getElementById('cfg-horas').value),
    };

    console.log('perfil:', perfil);
    console.log('perfilData:', perfilData);

    if (!perfil || !perfil.id) {
      showToast('Error: no se encontró el perfil', 'error');
      return;
    }

    const { data, error } = await supabase.from('perfiles_negocio').update(perfilData).eq('id', perfil.id).select();
    console.log('update result:', { data, error });

    if (error) {
      showToast('Error al guardar perfil: ' + error.message, 'error');
      return;
    }

    // Save horarios
    for (let dia = 0; dia < 7; dia++) {
      const toggle = container.querySelector(`.toggle[data-dia="${dia}"]`);
      const activo = toggle.classList.contains('active');
      const aperturaInput = container.querySelector(`input[data-field="apertura"][data-dia="${dia}"]`);
      const cierreInput = container.querySelector(`input[data-field="cierre"][data-dia="${dia}"]`);

      const horarioData = {
        user_id: perfil.user_id,
        dia_semana: dia,
        hora_apertura: aperturaInput.value + ':00',
        hora_cierre: cierreInput.value + ':00',
        activo,
      };

      const existente = horarioMap[dia];
      if (existente) {
        await supabase.from('horario_negocio').update(horarioData).eq('id', existente.id);
      } else {
        await supabase.from('horario_negocio').insert(horarioData);
      }
    }

    showToast('Configuración guardada');
    window.dispatchEvent(new CustomEvent('perfil:updated', { detail: perfilData }));
  });

  // Export handlers
  document.getElementById('export-ventas').addEventListener('click', () => exportCSV('ventas', 'ventas'));
  document.getElementById('export-insumos').addEventListener('click', () => exportCSV('insumos', 'insumos'));
  document.getElementById('export-costos').addEventListener('click', () => exportCSV('costos_fijos', 'costos_fijos'));

  // Logo upload placeholder
  document.getElementById('cfg-logo')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('El archivo supera 2MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById('logo-preview').innerHTML = `<img src="${ev.target.result}" class="w-full h-full object-cover rounded-2xl">`;
    };
    reader.readAsDataURL(file);
    showToast('Logo cargado — presiona Guardar para subir', 'info');
  });
}

async function exportCSV(table, filename) {
  const { data, error } = await supabase.from(table).select('*');
  if (error || !data?.length) { showToast('No hay datos para exportar', 'error'); return; }

  const headers = Object.keys(data[0]).filter(k => !k.startsWith('id') && !k.includes('user_id'));
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click(); URL.revokeObjectURL(url);
  showToast(`${filename} exportado correctamente`);
}
