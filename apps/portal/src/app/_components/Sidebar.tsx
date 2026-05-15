'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile hamburger */}
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

      {/* Overlay for mobile */}
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
                <span className="sidebar__logo-version">v2.0</span>
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

        <nav className="sidebar__nav" aria-label="Main navigation">
          <ul className="sidebar__menu">
            {MODULES.map((module) => (
              <li key={module.id}>
                <Link
                  href={module.href}
                  className={`sidebar__link ${isActive(module.href) ? 'active' : ''}`}
                  onClick={() => setIsMobileOpen(false)}
                  title={isCollapsed ? module.label : undefined}
                >
                  <span className="sidebar__link-icon">{module.icon}</span>
                  {!isCollapsed && <span className="sidebar__link-label">{module.label}</span>}
                  {isActive(module.href) && <span className="sidebar__link-indicator" />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar__footer">
          <Link href="/admin" className={`sidebar__link ${isActive('/admin') ? 'active' : ''}`} title={isCollapsed ? 'Admin' : undefined}>
            <span className="sidebar__link-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </span>
            {!isCollapsed && <span className="sidebar__link-label">Configurações</span>}
          </Link>
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
          background: var(--color-text-primary, #fff);
          border-radius: 1px;
          transition: all 0.2s;
        }

        .hamburger.open span:nth-child(1) {
          transform: rotate(45deg) translate(4px, 4px);
        }

        .hamburger.open span:nth-child(2) {
          opacity: 0;
        }

        .hamburger.open span:nth-child(3) {
          transform: rotate(-45deg) translate(4px, -4px);
        }

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
          background: #080b12;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: linear-gradient(180deg, #0f172a 0%, #080b12 100%);
        }

        .sidebar.collapsed {
          width: 80px;
        }

        .sidebar__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          background: radial-gradient(circle at top left, rgba(249, 115, 22, 0.08), transparent 100%);
        }

        .sidebar__logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: var(--color-text-primary, #fff);
          gap: 12px;
        }

        .sidebar__logo-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          border-radius: 12px;
          font-weight: 900;
          font-size: 14px;
          color: #fff;
          box-shadow: 0 8px 20px rgba(249, 115, 22, 0.3);
          flex-shrink: 0;
        }

        .sidebar__logo-meta {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }

        .sidebar__logo-text {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
          background: linear-gradient(to bottom, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sidebar__logo-version {
          font-size: 10px;
          color: #f97316;
          font-weight: 700;
          opacity: 0.8;
          margin-top: 2px;
        }

        .sidebar__collapse-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: var(--color-text-secondary, #94a3b8);
          cursor: pointer;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .sidebar__collapse-btn:hover {
          background: rgba(249, 115, 22, 0.1);
          color: #f97316;
          border-color: rgba(249, 115, 22, 0.3);
        }

        .sidebar__nav {
          flex: 1;
          overflow-y: auto;
          padding: 24px 12px;
          scrollbar-width: none;
        }

        .sidebar__nav::-webkit-scrollbar {
          display: none;
        }

        .sidebar__menu {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sidebar__link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 14px;
          border-radius: 14px;
          text-decoration: none;
          color: var(--color-text-secondary, #94a3b8);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          font-weight: 500;
          font-size: 14px;
        }

        .sidebar__link:hover {
          background: rgba(255, 255, 255, 0.03);
          color: var(--color-text-primary, #fff);
          transform: translateX(4px);
        }

        .sidebar.collapsed .sidebar__link:hover {
          transform: none;
        }

        .sidebar__link.active {
          background: rgba(249, 115, 22, 0.1);
          color: #f97316;
        }

        .sidebar__link-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          opacity: 0.6;
          transition: all 0.2s;
        }

        .sidebar__link.active .sidebar__link-icon,
        .sidebar__link:hover .sidebar__link-icon {
          opacity: 1;
          color: #f97316;
        }

        .sidebar__link-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar__link-indicator {
          position: absolute;
          left: -4px;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 18px;
          background: #f97316;
          border-radius: 0 4px 4px 0;
          box-shadow: 0 0 15px rgba(249, 115, 22, 0.6);
        }

        .sidebar__footer {
          padding: 16px 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        @media (max-width: 768px) {
          .sidebar-mobile-toggle {
            display: block;
          }

          .sidebar-overlay {
            display: block;
          }

          .sidebar {
            transform: translateX(-100%);
            display: block;
          }

          .sidebar-overlay {
            display: block;
          }

          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }

          .sidebar.mobile-open {
            transform: translateX(0);
          }

          .sidebar.collapsed {
            width: 260px;
          }
        }
      `}</style>
    </>
  );
}