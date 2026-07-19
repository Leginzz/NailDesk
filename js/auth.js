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
  authError.textContent = msg;
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

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    showError(error.message === 'User already registered'
      ? 'Este correo ya está registrado' : error.message);
    return;
  }

  if (data.user) {
    await supabase.from('perfiles_negocio').insert({
      user_id: data.user.id,
      nombre_salon: salon,
    });
    currentUser = data.user;
    showApp();
    window.dispatchEvent(new CustomEvent('auth:ready', { detail: { user: currentUser } }));
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
