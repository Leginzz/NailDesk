// ============================================================
// NailDesk — Authentication Module
// ============================================================

import supabase from './supabase.js';

const authScreen = document.getElementById('auth-screen');
const appShell = document.getElementById('app-shell');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const authError = document.getElementById('auth-error');

let currentUser = null;

function showError(msg) {
  authError.textContent = typeof msg === 'object' ? JSON.stringify(msg) : msg;
  authError.classList.remove('hidden');
}

function hideError() { authError.classList.add('hidden'); }
function showApp() { authScreen.classList.add('hidden'); appShell.classList.remove('hidden'); }
function showAuth() { appShell.classList.add('hidden'); authScreen.classList.remove('hidden'); }

// Tab switching
tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('bg-white', 'text-terracota-600', 'shadow-sm');
  tabLogin.classList.remove('text-gray-400');
  tabRegister.classList.remove('bg-white', 'text-terracota-600', 'shadow-sm');
  tabRegister.classList.add('text-gray-400');
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
  hideError();
});

tabRegister.addEventListener('click', () => {
  tabRegister.classList.add('bg-white', 'text-terracota-600', 'shadow-sm');
  tabRegister.classList.remove('text-gray-400');
  tabLogin.classList.remove('bg-white', 'text-terracota-600', 'shadow-sm');
  tabLogin.classList.add('text-gray-400');
  registerForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
  hideError();
});

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    showError(error.message === 'Invalid login credentials'
      ? 'Correo o contraseña incorrectos' : error.message);
    return;
  }
  currentUser = data.user;
  showApp();
  window.dispatchEvent(new CustomEvent('auth:ready', { detail: { user: currentUser } }));
});

// Register
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  const salon = document.getElementById('register-salon').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  const btn = registerForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Creando cuenta...';

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      const msg = error.message || error.msg || String(error);
      if (msg === 'User already registered') showError('Este correo ya esta registrado');
      else if (msg === 'Unable to validate email address: invalid format') showError('Correo electronico invalido');
      else if (msg === 'Password should be at least 6 characters') showError('La contrasena debe tener al menos 6 caracteres');
      else showError(msg || 'Error desconocido al crear cuenta');
      btn.disabled = false;
      btn.textContent = 'Crear Cuenta';
      return;
    }

    if (data.user) {
      const { data: profileData, error: profileErr } = await supabase.from('perfiles_negocio').insert({
        user_id: data.user.id,
        nombre_salon: salon,
      }).select();

      if (profileErr) {
        showError('Cuenta creada pero error al crear perfil: ' + (profileErr.message || String(profileErr)));
        btn.disabled = false;
        btn.textContent = 'Crear Cuenta';
        return;
      }

      if (data.session) {
        currentUser = data.user;
        showApp();
        window.dispatchEvent(new CustomEvent('auth:ready', { detail: { user: currentUser } }));
      } else {
        showError('Cuenta creada. Revisa tu correo para confirmar tu cuenta antes de iniciar sesion.');
        btn.disabled = false;
        btn.textContent = 'Crear Cuenta';
      }
    } else {
      showError('Cuenta creada. Revisa tu correo para confirmar tu cuenta.');
      btn.disabled = false;
      btn.textContent = 'Crear Cuenta';
    }
  } catch (err) {
    showError('Error inesperado: ' + (err.message || String(err)));
    btn.disabled = false;
    btn.textContent = 'Crear Cuenta';
  }
});

// Logout
document.getElementById('btn-logout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  currentUser = null;
  showAuth();
});

// Check existing session
export async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    showApp();
    window.dispatchEvent(new CustomEvent('auth:ready', { detail: { user: currentUser } }));
  } else {
    showAuth();
  }
  return currentUser;
}

export function getUser() { return currentUser; }
