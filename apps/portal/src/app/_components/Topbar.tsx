'use client';

import { useSession } from '@fbr/auth/client';
import { useState } from 'react';

interface Company {
  id: string;
  nome: string;
  logo?: string;
}

const MOCK_COMPANIES: Company[] = [
  { id: '11111111-1111-4111-8111-111111111111', nome: 'Empresa Alpha' },
  { id: '22222222-2222-4222-8222-222222222222', nome: 'Empresa Beta' },
];

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Novo lead qualificado', message: 'João Silva entrou no pipeline CRM', read: false, time: '5 min', type: 'info' },
  { id: '2', title: 'Pagamento recebido', message: 'R$ 15.000 de Google Ads', read: false, time: '1h', type: 'success' },
  { id: '3', title: 'Alerta de reconciliation', message: '3 itens precisam de revisão', read: true, time: '2h', type: 'warning' },
];

export function Topbar() {
  const { user } = useSession();
  const [selectedCompany, setSelectedCompany] = useState<Company>(MOCK_COMPANIES[0]!);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notifications = MOCK_NOTIFICATIONS;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="topbar">
      <div className="topbar__left">
        {/* Space for mobile menu toggle via CSS */}
      </div>

      <div className="topbar__right">
        {/* Company Selector */}
        <div className="topbar__dropdown">
          <button
            className="topbar__company-btn"
            onClick={() => setIsCompanyOpen(!isCompanyOpen)}
            aria-expanded={isCompanyOpen}
          >
            <span className="topbar__company-icon">🏢</span>
            <span className="topbar__company-name">{selectedCompany.nome}</span>
            <span className="topbar__dropdown-arrow">▼</span>
          </button>
          {isCompanyOpen && (
            <div className="topbar__dropdown-menu">
              {MOCK_COMPANIES.map((company) => (
                <button
                  key={company.id}
                  className={`topbar__dropdown-item ${company.id === selectedCompany.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCompany(company);
                    setIsCompanyOpen(false);
                  }}
                >
                  <span className="topbar__company-icon">🏢</span>
                  {company.nome}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="topbar__dropdown">
          <button
            className="topbar__icon-btn"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            aria-expanded={isNotificationsOpen}
            aria-label="Notifications"
          >
            <span>🔔</span>
            {unreadCount > 0 && <span className="topbar__badge">{unreadCount}</span>}
          </button>
          {isNotificationsOpen && (
            <div className="topbar__dropdown-menu topbar__notifications">
              <div className="topbar__notifications-header">
                <span>Notificações</span>
                <button className="topbar__mark-read">Marcar todas como lidas</button>
              </div>
              <div className="topbar__notifications-list">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`topbar__notification-item ${notification.read ? 'read' : ''}`}
                  >
                    <span className={`topbar__notification-icon ${notification.type}`}>
                      {notification.type === 'info' && 'ℹ️'}
                      {notification.type === 'success' && '✅'}
                      {notification.type === 'warning' && '⚠️'}
                      {notification.type === 'error' && '❌'}
                    </span>
                    <div className="topbar__notification-content">
                      <strong>{notification.title}</strong>
                      <p>{notification.message}</p>
                      <span className="topbar__notification-time">{notification.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="topbar__notifications-footer">
                <button>Ver todas as notificações</button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="topbar__dropdown">
          <button
            className="topbar__profile-btn"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-expanded={isProfileOpen}
          >
            <div className="topbar__avatar">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="topbar__user-info">
              <span className="topbar__user-name">{user?.email?.split('@')[0] || 'Operador'}</span>
              <span className="topbar__user-role">{user?.role || 'Admin'}</span>
            </div>
          </button>
          {isProfileOpen && (
            <div className="topbar__dropdown-menu">
              <div className="topbar__profile-header">
                <div className="topbar__avatar large">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <strong>{user?.email?.split('@')[0] || 'Operador'}</strong>
                  <span>{user?.email}</span>
                </div>
              </div>
              <div className="topbar__dropdown-divider" />
              <button className="topbar__dropdown-item">👤 Meu Perfil</button>
              <button className="topbar__dropdown-item">⚙️ Configurações</button>
              <div className="topbar__dropdown-divider" />
              <button className="topbar__dropdown-item logout">🚪 Sair</button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .topbar {
          position: fixed;
          top: 0;
          left: 260px;
          right: 0;
          height: 60px;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 100;
        }

        .topbar__left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .topbar__right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .topbar__dropdown {
          position: relative;
        }

        .topbar__company-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          color: var(--color-text-primary, #fff);
          cursor: pointer;
          transition: all 0.2s;
        }

        .topbar__company-btn:hover {
          border-color: var(--color-primary, #f97316);
          background: rgba(249, 115, 22, 0.05);
        }

        .topbar__company-icon {
          font-size: 16px;
        }

        .topbar__company-name {
          font-size: 13px;
          font-weight: 600;
        }

        .topbar__dropdown-arrow {
          font-size: 8px;
          color: var(--color-text-secondary, #94a3b8);
          opacity: 0.5;
        }

        .topbar__icon-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          cursor: pointer;
          font-size: 16px;
          color: var(--color-text-secondary, #94a3b8);
          transition: all 0.2s;
        }

        .topbar__icon-btn:hover {
          background: rgba(249, 115, 22, 0.1);
          color: var(--color-primary, #f97316);
          border-color: rgba(249, 115, 22, 0.2);
        }

        .topbar__badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          background: var(--color-primary, #f97316);
          border-radius: 9px;
          font-size: 10px;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 10px rgba(249, 115, 22, 0.4);
        }

        .topbar__profile-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 12px 4px 4px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          cursor: pointer;
          color: var(--color-text-primary, #fff);
          transition: all 0.2s;
        }

        .topbar__profile-btn:hover {
          background: rgba(249, 115, 22, 0.1);
          border-color: rgba(249, 115, 22, 0.2);
        }

        .topbar__avatar {
          width: 30px;
          height: 30px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          color: #fff;
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2);
        }

        .topbar__avatar.large {
          width: 44px;
          height: 44px;
          font-size: 16px;
          border-radius: 14px;
        }

        .topbar__user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .topbar__user-name {
          font-size: 13px;
          font-weight: 600;
          line-height: 1.2;
        }

        .topbar__user-role {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-primary, #f97316);
          font-weight: 700;
        }

        .topbar__dropdown-menu {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          min-width: 220px;
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          z-index: 1000;
          padding: 6px;
        }

        .topbar__dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 14px;
          background: none;
          border: none;
          border-radius: 10px;
          color: var(--color-text-primary, #fff);
          font-size: 14px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }

        .topbar__dropdown-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--color-primary, #f97316);
        }

        .topbar__dropdown-item.active {
          background: rgba(249, 115, 22, 0.1);
          color: var(--color-primary, #f97316);
        }

        .topbar__dropdown-item.logout {
          color: #ef4444;
        }

        .topbar__dropdown-item.logout:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .topbar__dropdown-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          margin: 6px;
        }

        .topbar__notifications {
          width: 360px;
          max-height: 480px;
        }

        .topbar__notifications-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .topbar__notifications-header span {
          font-weight: 700;
          font-size: 15px;
        }

        .topbar__mark-read {
          background: none;
          border: none;
          color: var(--color-primary, #f97316);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .topbar__notifications-list {
          max-height: 320px;
          overflow-y: auto;
          padding: 8px;
        }

        .topbar__notification-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .topbar__notification-item:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .topbar__notification-item.read {
          opacity: 0.5;
        }

        .topbar__notification-icon {
          font-size: 16px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          flex-shrink: 0;
        }

        .topbar__notification-content {
          flex: 1;
          min-width: 0;
        }

        .topbar__notification-content strong {
          display: block;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .topbar__notification-content p {
          font-size: 12px;
          color: var(--color-text-secondary, #94a3b8);
          margin: 0 0 4px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .topbar__notification-time {
          font-size: 11px;
          color: var(--color-text-secondary, #94a3b8);
          opacity: 0.7;
        }

        .topbar__notifications-footer {
          padding: 12px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          text-align: center;
        }

        .topbar__notifications-footer button {
          background: none;
          border: none;
          color: var(--color-primary, #f97316);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .topbar__profile-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          margin: -6px -6px 6px -6px;
        }

        .topbar__profile-header strong {
          display: block;
          font-size: 15px;
          font-weight: 700;
        }

        .topbar__profile-header span {
          font-size: 12px;
          color: var(--color-text-secondary, #94a3b8);
        }

        @media (max-width: 768px) {
          .topbar {
            left: 0;
            padding: 0 16px 0 64px;
          }

          .topbar__user-info {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}