'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSession } from '@fbr/auth/client';

interface Company {
  id: string;
  nome: string;
  logo?: string;
}

const MOCK_COMPANIES: Company[] = [
  { id: '11111111-1111-4111-8111-111111111111', nome: 'Empresa Alpha' },
  { id: '22222222-2222-4222-8222-222222222222', nome: 'Empresa Beta' },
];

const MODULES = [
  { id: 'mkt', label: 'Marketing', href: '/mkt', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></svg>
  ) },
  { id: 'leads', label: 'Leads', href: '/leads', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ) },
  { id: 'click', label: 'CRM', href: '/click', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
  ) },
  { id: 'sales', label: 'Vendas', href: '/sales', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  ) },
  { id: 'finance', label: 'Financeiro', href: '/finance', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
  ) },
  { id: 'redacao', label: 'Redação', href: '/redacao', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  ) },
  { id: 'design', label: 'Design', href: '/design', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 5 5"/><path d="m9.5 14.5 4 4"/></svg>
  ) },
  { id: 'social', label: 'Social', href: '/social', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
  ) },
  { id: 'videoflow', label: 'VideoFlow', href: '/videoflow', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
  ) },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company>(MOCK_COMPANIES[0]!);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        <span className={`hamburger ${isMobileOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)} />
      )}

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar__header">
          <Link href="/" className="sidebar__logo">
            <span className="sidebar__logo-icon">FBR</span>
            {!isCollapsed && (
              <div className="sidebar__logo-meta">
                <span className="sidebar__logo-text">Portal</span>
                <span className="sidebar__logo-version">v2.1</span>
              </div>
            )}
          </Link>
          <button
            className="sidebar__collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, transform: isCollapsed ? 'rotate(180deg)' : 'none' }}>
              <path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>
            </svg>
          </button>
        </div>

        {/* Company Selector Integration */}
        <div className="sidebar__company">
          <button
            className="sidebar__company-trigger"
            onClick={() => setIsCompanyOpen(!isCompanyOpen)}
          >
            <div className="sidebar__company-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>
            </div>
            {!isCollapsed && (
              <>
                <span className="sidebar__company-name">{selectedCompany.nome}</span>
                <span className="sidebar__company-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </>
            )}
          </button>
          {!isCollapsed && isCompanyOpen && (
            <div className="sidebar__company-dropdown">
              {MOCK_COMPANIES.map((company) => (
                <button
                  key={company.id}
                  className={`sidebar__company-option ${company.id === selectedCompany.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCompany(company);
                    setIsCompanyOpen(false);
                  }}
                >
                  {company.nome}
                </button>
              ))}
            </div>
          )}
        </div>

        <nav className="sidebar__nav">
          <ul className="sidebar__menu">
            {MODULES.map((module) => (
              <li key={module.id}>
                <Link
                  href={module.href}
                  className={`sidebar__link ${isActive(module.href) ? 'active' : ''}`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <span className="sidebar__link-icon">{module.icon}</span>
                  {!isCollapsed && <span className="sidebar__link-label">{module.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar__footer">
          <button className="sidebar__link" title={isCollapsed ? 'Notificações' : undefined}>
            <span className="sidebar__link-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            </span>
            {!isCollapsed && <span className="sidebar__link-label">Notificações</span>}
            <span className="sidebar__badge">3</span>
          </button>

          <Link href="/admin" className={`sidebar__link ${isActive('/admin') ? 'active' : ''}`} title={isCollapsed ? 'Configurações' : undefined}>
            <span className="sidebar__link-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </span>
            {!isCollapsed && <span className="sidebar__link-label">Configurações</span>}
          </Link>

          <div className="sidebar__divider" />

          {/* User Profile Integration */}
          <button className="sidebar__user" title={isCollapsed ? user?.email : undefined}>
            <div className="sidebar__user-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            {!isCollapsed && (
              <div className="sidebar__user-info">
                <span className="sidebar__user-name">{user?.email?.split('@')[0] || 'Operador'}</span>
                <span className="sidebar__user-role">FBR Operator</span>
              </div>
            )}
          </button>
        </div>
      </aside>

      <style jsx>{`
        .sidebar-mobile-toggle {
          display: none;
          position: fixed;
          top: 12px;
          left: 12px;
          z-index: 1001;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
        }

        .hamburger {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 24px;
        }

        .hamburger span {
          display: block;
          height: 2px;
          background: #fff;
          border-radius: 1px;
          transition: all 0.2s;
        }

        .hamburger.open span:nth-child(1) { transform: rotate(45deg) translate(4px, 4px); }
        .hamburger.open span:nth-child(2) { opacity: 0; }
        .hamburger.open span:nth-child(3) { transform: rotate(-45deg) translate(4px, -4px); }

        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 999;
        }

        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 260px;
          background: #0f172a;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar.collapsed { width: 80px; }

        .sidebar__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 16px;
        }

        .sidebar__logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: #fff;
          gap: 12px;
        }

        .sidebar__logo-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          border-radius: 12px;
          font-weight: 900;
          font-size: 16px;
          color: #fff;
          box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4);
        }

        .sidebar__logo-text { font-size: 22px; font-weight: 900; letter-spacing: -0.03em; }
        .sidebar__logo-version { font-size: 11px; color: #f97316; font-weight: 800; text-transform: uppercase; }

        .sidebar__collapse-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
        }

        /* Company Selector Styles */
        .sidebar__company { padding: 0 16px 16px; position: relative; }
        .sidebar__company-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sidebar__company-trigger:hover { background: rgba(255, 255, 255, 0.08); border-color: #f97316; }

        .sidebar__company-icon {
          width: 20px;
          height: 20px;
          color: #f97316;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.8;
          flex-shrink: 0;
        }

        .sidebar__company-icon :global(svg) {
          width: 100%;
          height: 100%;
        }

        .sidebar__company-name { flex: 1; text-align: left; font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sidebar__company-arrow { color: #94a3b8; display: flex; }

        .sidebar__company-dropdown {
          position: absolute;
          top: 100%;
          left: 16px;
          right: 16px;
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          z-index: 1001;
          margin-top: 4px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          overflow: hidden;
        }
        .sidebar__company-option {
          width: 100%;
          padding: 12px 16px;
          background: none;
          border: none;
          color: #f3f7fb;
          text-align: left;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }
        .sidebar__company-option:hover { background: rgba(249, 115, 22, 0.1); color: #f97316; }
        .sidebar__company-option.active { color: #f97316; font-weight: 700; }

        .sidebar__nav { flex: 1; overflow-y: auto; padding: 16px 12px; scrollbar-width: none; }
        .sidebar__menu { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }

        .sidebar__link {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-radius: 12px;
          text-decoration: none !important;
          color: #94a3b8;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          font-family: inherit;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: -0.02em;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          outline: none;
        }

        .sidebar__link:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          text-decoration: none !important;
        }

        .sidebar__link.active {
          background: rgba(249, 115, 22, 0.12);
          color: #f97316;
          text-decoration: none !important;
        }

        .sidebar__link-icon {
          width: 20px;
          height: 20px;
          opacity: 0.8;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar__link-icon :global(svg) {
          width: 100%;
          height: 100%;
          display: block;
        }

        .sidebar__link-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1;
          margin: 0;
          padding: 0;
        }

        .sidebar__badge {
          background: #f97316;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 8px;
          margin-left: auto;
        }

        .sidebar.collapsed .sidebar__badge {
          position: absolute;
          top: 6px;
          right: 6px;
        }

        .sidebar__footer {
          padding: 16px 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar__divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.05);
          margin: 8px 4px;
        }

        .sidebar__user {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          cursor: pointer;
          color: #fff;
          transition: all 0.2s;
          width: 100%;
        }

        .sidebar__user:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(249, 115, 22, 0.3);
        }

        .sidebar__user-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }

        .sidebar__user-avatar :global(svg) {
          width: 18px;
          height: 18px;
        }

        .sidebar__user-info { display: flex; flex-direction: column; text-align: left; }
        .sidebar__user-name { font-size: 14px; font-weight: 700; color: #fff; }
        .sidebar__user-role { font-size: 10px; color: #f97316; font-weight: 800; text-transform: uppercase; }

        @media (max-width: 768px) {
          .sidebar-mobile-toggle { display: block; }
          .sidebar { transform: translateX(-100%); width: 280px; }
          .sidebar.mobile-open { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}