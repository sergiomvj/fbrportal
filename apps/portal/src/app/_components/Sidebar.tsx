'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const MODULES = [
  { id: 'mkt', label: 'Marketing', href: '/mkt', icon: '🎯' },
  { id: 'leads', label: 'Leads', href: '/leads', icon: '👥' },
  { id: 'click', label: 'CRM', href: '/click', icon: '📊' },
  { id: 'sales', label: 'Vendas', href: '/sales', icon: '💰' },
  { id: 'finance', label: 'Financeiro', href: '/finance', icon: '💳' },
  { id: 'redacao', label: 'Redação', href: '/redacao', icon: '📝' },
  { id: 'design', label: 'Design', href: '/design', icon: '🎨' },
  { id: 'social', label: 'Social', href: '/social', icon: '📱' },
  { id: 'videoflow', label: 'VideoFlow', href: '/videoflow', icon: '🎬' },
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
            {!isCollapsed && <span className="sidebar__logo-text">FBR Portal</span>}
            {isCollapsed && <span className="sidebar__logo-icon">F</span>}
          </Link>
          <button
            className="sidebar__collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? '→' : '←'}
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
          <Link href="/admin" className="sidebar__link" title={isCollapsed ? 'Admin' : undefined}>
            <span className="sidebar__link-icon">⚙️</span>
            {!isCollapsed && <span className="sidebar__link-label">Admin</span>}
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
          background: var(--color-bg-secondary, #1e293b);
          border: none;
          padding: 8px;
          border-radius: 6px;
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
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
        }

        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 260px;
          background: var(--color-bg-secondary, #1e293b);
          border-right: 1px solid var(--color-border, #334155);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          transition: width 0.2s ease;
        }

        .sidebar.collapsed {
          width: 72px;
        }

        .sidebar__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid var(--color-border, #334155);
        }

        .sidebar__logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: var(--color-text-primary, #fff);
          font-weight: 700;
          font-size: 18px;
        }

        .sidebar__logo-text {
          white-space: nowrap;
        }

        .sidebar__logo-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-primary, #3b82f6);
          border-radius: 8px;
        }

        .sidebar__collapse-btn {
          background: none;
          border: none;
          color: var(--color-text-secondary, #94a3b8);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .sidebar__collapse-btn:hover {
          background: var(--color-bg-hover, #334155);
        }

        .sidebar__nav {
          flex: 1;
          overflow-y: auto;
          padding: 12px 8px;
        }

        .sidebar__menu {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar__link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          text-decoration: none;
          color: var(--color-text-secondary, #94a3b8);
          transition: all 0.2s;
          position: relative;
        }

        .sidebar__link:hover {
          background: var(--color-bg-hover, #334155);
          color: var(--color-text-primary, #fff);
        }

        .sidebar__link.active {
          background: var(--color-primary-alpha, rgba(59, 130, 246, 0.15));
          color: var(--color-primary, #3b82f6);
        }

        .sidebar__link-icon {
          font-size: 18px;
          width: 24px;
          text-align: center;
          flex-shrink: 0;
        }

        .sidebar__link-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar__link-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 20px;
          background: var(--color-primary, #3b82f6);
          border-radius: 0 2px 2px 0;
        }

        .sidebar__footer {
          padding: 12px 8px;
          border-top: 1px solid var(--color-border, #334155);
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