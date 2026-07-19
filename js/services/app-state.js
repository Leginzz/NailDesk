// ============================================================
// NailDesk — App State Service
// Estado centralizado: rol, suscripción, módulos habilitados
// ============================================================

import supabase from '../supabase.js';

const AppState = {
  _role: 'user',
  _subscription: null,
  _plan: null,
  _modules: [],
  _ready: false,
  _listeners: [],

  get isReady() { return this._ready; },
  get role() { return this._role; },
  get isAdmin() { return this._role === 'admin'; },
  get subscription() { return this._subscription; },
  get plan() { return this._plan; },
  get modules() { return this._modules; },
  get isBlocked() {
    return this._subscription && ['suspendido', 'cancelado'].includes(this._subscription.estado);
  },

  isModuleEnabled(clave) {
    return this._modules.some(m => m.clave === clave);
  },

  onChange(fn) {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(l => l !== fn); };
  },

  _emit() {
    this._listeners.forEach(fn => fn(this));
  },

  async load(userId) {
    this._ready = false;

    // 1. Rol
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    this._role = roleData?.role || 'user';

    // 2. Suscripción + plan
    const { data: sub } = await supabase
      .from('suscripciones')
      .select('*, plan:planes_suscripcion(*)')
      .eq('user_id', userId)
      .maybeSingle();
    this._subscription = sub;
    this._plan = sub?.plan || null;

    // 3. Módulos habilitados (si es admin, todos)
    if (this.isAdmin) {
      const { data: all } = await supabase
        .from('modulos_sistema')
        .select('*')
        .eq('activo', true)
        .order('orden');
      this._modules = all || [];
    } else {
      // Módulos del plan
      const { data: planMods } = await supabase
        .from('plan_modulos')
        .select('modulo:modulos_sistema(*)')
        .eq('plan_id', this._plan?.id || '00000000-0000-0000-0000-000000000000');
      const planModules = (planMods || []).map(pm => pm.modulo).filter(Boolean);

      // Overrides del salón
      const { data: overrides } = await supabase
        .from('salon_modulos')
        .select('modulo:modulos_sistema(*), habilitado')
        .eq('user_id', userId);

      const modMap = new Map();
      planModules.forEach(m => modMap.set(m.clave, m));
      (overrides || []).forEach(o => {
        if (o.habilitado && o.modulo) modMap.set(o.modulo.clave, o.modulo);
        else if (!o.habilitado) modMap.delete(o.modulo?.clave);
      });

      this._modules = [...modMap.values()].sort((a, b) => a.orden - b.orden);
    }

    this._ready = true;
    this._emit();
    return this;
  },

  reset() {
    this._role = 'user';
    this._subscription = null;
    this._plan = null;
    this._modules = [];
    this._ready = false;
    this._listeners = [];
  }
};

export default AppState;
