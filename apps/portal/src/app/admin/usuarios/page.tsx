'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  nome: string;
  email?: string;
  cargo?: string;
  ativo: boolean;
  criado_em: string;
}

interface Role {
  id: string;
  nome: string;
  descricao: string;
  nivel: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ nome: '', email: '', cargo: '', ativo: true });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/roles'),
      ]);

      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();

      if (usersData.users) setUsers(usersData.users);
      if (rolesData.roles) setRoles(rolesData.roles);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingUser(null);
        setFormData({ nome: '', email: '', cargo: '', ativo: true });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setFormData({ nome: user.nome, email: user.email || '', cargo: user.cargo || '', ativo: user.ativo });
    setShowModal(true);
  }

  if (loading) {
    return <div className="admin-loading">Carregando...</div>;
  }

  return (
    <div className="admin-users">
      <header className="admin-users__header">
        <div>
          <h1>Gestão de Usuários</h1>
          <p>Gerencie usuários e permissões da empresa</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditingUser(null); setFormData({ nome: '', email: '', cargo: '', ativo: true }); setShowModal(true); }}>
          + Novo Usuário
        </button>
      </header>

      <div className="admin-users__table-wrap">
        <table className="admin-users__table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Cargo</th>
              <th>Status</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.nome}</td>
                <td>{user.email || '-'}</td>
                <td>{user.cargo || '-'}</td>
                <td>
                  <span className={`badge ${user.ativo ? 'badge--green' : 'badge--gray'}`}>
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>{new Date(user.criado_em).toLocaleDateString('pt-BR')}</td>
                <td>
                  <button className="btn-icon" onClick={() => openEdit(user)} title="Editar">✏️</button>
                  <button className="btn-icon danger" onClick={() => handleDelete(user.id)} title="Excluir">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome</label>
                <input type="text" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Cargo</label>
                <input type="text" value={formData.cargo} onChange={e => setFormData({ ...formData, cargo: e.target.value })} />
              </div>
              <div className="form-group checkbox">
                <label>
                  <input type="checkbox" checked={formData.ativo} onChange={e => setFormData({ ...formData, ativo: e.target.checked })} />
                  Usuário ativo
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">{editingUser ? 'Salvar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-users {
          padding: 24px;
        }

        .admin-users__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .admin-users__header h1 {
          margin: 0 0 4px;
          font-size: 24px;
        }

        .admin-users__header p {
          margin: 0;
          color: var(--color-text-secondary, #94a3b8);
        }

        .admin-users__table-wrap {
          background: var(--color-bg-secondary, #1e293b);
          border-radius: 12px;
          overflow: hidden;
        }

        .admin-users__table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-users__table th,
        .admin-users__table td {
          padding: 16px;
          text-align: left;
          border-bottom: 1px solid var(--color-border, #334155);
        }

        .admin-users__table th {
          background: rgba(255, 255, 255, 0.03);
          color: var(--color-text-secondary, #94a3b8);
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
        }

        .admin-users__table tr:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .btn-primary {
          background: var(--color-primary, #3b82f6);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-secondary {
          background: transparent;
          color: var(--color-text-primary, #fff);
          border: 1px solid var(--color-border, #334155);
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
        }

        .btn-icon {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          font-size: 16px;
        }

        .btn-icon.danger:hover {
          opacity: 0.7;
        }

        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge--green {
          background: rgba(16, 185, 129, 0.18);
          color: #a7f3d0;
        }

        .badge--gray {
          background: rgba(107, 114, 128, 0.18);
          color: #d1d5db;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: var(--color-bg-secondary, #1e293b);
          border-radius: 16px;
          padding: 24px;
          width: 100%;
          max-width: 480px;
        }

        .modal h2 {
          margin: 0 0 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          color: var(--color-text-secondary, #94a3b8);
        }

        .form-group input[type="text"],
        .form-group input[type="email"] {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--color-border, #334155);
          border-radius: 8px;
          background: var(--color-bg-primary, #0f172a);
          color: var(--color-text-primary, #fff);
        }

        .form-group.checkbox label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
      `}</style>
    </div>
  );
}