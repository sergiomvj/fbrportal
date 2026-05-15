-- RBAC Tables Migration
-- Creates: users, user_roles, roles, permissions, role_permissions

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS portal_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  avatar_url TEXT,
  cargo TEXT,
  telefone TEXT,
  ativo BOOLEAN DEFAULT true,
  ultimo_login TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  plano TEXT DEFAULT 'free',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  nivel INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Role junction (user can have multiple roles)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES portal_users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES portal_users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id, empresa_id)
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo TEXT NOT NULL,
  acao TEXT NOT NULL,
  descricao TEXT,
  UNIQUE(modulo, acao)
);

-- Role-Permission junction
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Insert default roles
INSERT INTO roles (nome, descricao, nivel, is_default) VALUES
  ('owner', 'Proprietário da empresa - acesso total', 100, false),
  ('admin', 'Administrador - gestão completa', 90, false),
  ('gestor', 'Gestor - supervisão de equipes', 70, false),
  ('operador', 'Operador - uso day-to-day', 50, true),
  ('viewer', 'Visualizador - apenas leitura', 10, false)
ON CONFLICT (nome) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (modulo, acao, descricao) VALUES
  -- MKT
  ('mkt', 'read', 'Visualizar estratégias'),
  ('mkt', 'create', 'Criar estratégias'),
  ('mkt', 'edit', 'Editar estratégias'),
  ('mkt', 'delete', 'Excluir estratégias'),
  ('mkt', 'export', 'Exportar estratégias'),
  -- Leads
  ('leads', 'read', 'Visualizar leads'),
  ('leads', 'create', 'Criar leads'),
  ('leads', 'edit', 'Editar leads'),
  ('leads', 'delete', 'Excluir leads'),
  ('leads', 'qualificar', 'Qualificar leads'),
  -- Click
  ('click', 'read', 'Visualizar deals'),
  ('click', 'create', 'Criar deals'),
  ('click', 'edit', 'Editar deals'),
  ('click', 'delete', 'Excluir deals'),
  ('click', 'move_stage', 'Mover pipeline'),
  -- Sales
  ('sales', 'read', 'Visualizar parceiros'),
  ('sales', 'create', 'Criar parceiros'),
  ('sales', 'edit', 'Editar parceiros'),
  ('sales', 'delete', 'Excluir parceiros'),
  ('sales', 'approve', 'Aprovar receitas'),
  -- Finance
  ('finance', 'read', 'Visualizar finanças'),
  ('finance', 'create', 'Criar lançamentos'),
  ('finance', 'edit', 'Editar lançamentos'),
  ('finance', 'delete', 'Excluir lançamentos'),
  ('finance', 'approve', 'Aprovar pagamentos'),
  ('finance', 'conciliar', 'Conciliar extratos'),
  -- Redacao
  ('redacao', 'read', 'Visualizar artigos'),
  ('redacao', 'create', 'Criar artigos'),
  ('redacao', 'edit', 'Editar artigos'),
  ('redacao', 'publish', 'Publicar artigos'),
  ('redacao', 'delete', 'Excluir artigos'),
  -- Design
  ('design', 'read', 'Visualizar jobs'),
  ('design', 'create', 'Criar jobs'),
  ('design', 'edit', 'Editar jobs'),
  ('design', 'approve', 'Aprovar deliveries'),
  ('design', 'delete', 'Excluir jobs'),
  -- Social
  ('social', 'read', 'Visualizar posts'),
  ('social', 'create', 'Criar posts'),
  ('social', 'edit', 'Editar posts'),
  ('social', 'publish', 'Publicar posts'),
  ('social', 'delete', 'Excluir posts'),
  -- Admin
  ('admin', 'users', 'Gerenciar usuários'),
  ('admin', 'roles', 'Gerenciar roles'),
  ('admin', 'settings', 'Configurações do sistema')
ON CONFLICT (modulo, acao) DO NOTHING;

-- Grant all permissions to owner role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.nome = 'owner'
ON CONFLICT DO NOTHING;

-- Grant basic permissions to operador role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.nome = 'operador' AND p.acao IN ('read', 'create', 'edit')
ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Users: user can read own profile, admins can read all
CREATE POLICY "Users can read own profile" ON portal_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can manage users" ON portal_roles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.nome IN ('owner', 'admin'))
  );

-- Indexes
CREATE INDEX idx_portal_users_empresa ON portal_users(empresa_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_empresa ON user_roles(empresa_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);