-- ============================================================
-- Migration: Crear tabla user_roles
-- Fecha: 2026-07-20
-- Descripción: Tabla de roles de usuario (admin/user)
-- ============================================================

-- Crear tabla
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "user_roles_select_own" ON user_roles;
DROP POLICY IF EXISTS "user_roles_admin_select_all" ON user_roles;
DROP POLICY IF EXISTS "user_roles_admin_insert" ON user_roles;
DROP POLICY IF EXISTS "user_roles_admin_update" ON user_roles;

CREATE POLICY "user_roles_select_own" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_roles_admin_select_all" ON user_roles FOR SELECT USING (is_admin());
CREATE POLICY "user_roles_admin_insert" ON user_roles FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "user_roles_admin_update" ON user_roles FOR UPDATE USING (is_admin());

-- Índice
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);

-- Hacer admin al primer usuario (ajustar UUID según necesidad)
INSERT INTO user_roles (user_id, role)
VALUES ('db2e26d5-fb11-4d7d-bfd4-829763bc84c8', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Fix: Trigger auto_admin_first_user con search_path correcto
CREATE OR REPLACE FUNCTION auto_admin_first_user()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
