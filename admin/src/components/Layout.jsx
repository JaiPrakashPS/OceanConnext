import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

const NAV_GROUPS = [
  {
    section: 'Overview',
    items: [
      { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    ],
  },
  {
    section: 'People',
    items: [
      { to: '/users', icon: '👥', label: 'Fishermen' },
      { to: '/officers', icon: '🎖️', label: 'Officers' },
    ],
  },
  {
    section: 'Operations',
    items: [
      { to: '/sos', icon: '🆘', label: 'SOS Alerts' },
      { to: '/complaints', icon: '📋', label: 'Complaints' },
    ],
  },
  {
    section: 'Resources',
    items: [
      { to: '/schemes', icon: '📜', label: 'Gov. Schemes' },
      { to: '/notifications', icon: '🔔', label: 'Notifications' },
    ],
  },
  {
    section: 'System',
    items: [
      { to: '/audit-logs', icon: '🔍', label: 'Audit Logs' },
    ],
  },
];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard Overview',
  '/users': 'Fishermen Management',
  '/officers': 'Officer Management',
  '/sos': 'SOS Alert Monitor',
  '/complaints': 'Complaint Resolution',
  '/schemes': 'Government Schemes',
  '/notifications': 'Broadcast Notifications',
  '/audit-logs': 'System Audit Logs',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const currentTitle = PAGE_TITLES[location.pathname] || 'Ocean Connect Admin';

  return (
    <div className={styles.shell}>
      {/* Sidebar (Deep Ocean Blue 30% anchor) */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.collapsed}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandIconWrapper}>
            <span className={styles.brandIcon}>🌊</span>
          </div>
          {sidebarOpen && (
            <div className={styles.brandText}>
              <div className={styles.brandName}>Ocean Connect</div>
              <div className={styles.brandSub}>Maritime Portal</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {NAV_GROUPS.map(group => (
            <React.Fragment key={group.section}>
              {sidebarOpen && <div className={styles.navSection}>{group.section}</div>}
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={!sidebarOpen ? item.label : undefined}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.active : ''}`
                  }
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {sidebarOpen && <span className={styles.navLabel}>{item.label}</span>}
                </NavLink>
              ))}
            </React.Fragment>
          ))}
        </nav>

        {/* Bottom: user info + logout */}
        <div className={styles.sidebarBottom}>
          {sidebarOpen && (
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>{(user?.name || 'A')[0].toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <div className={styles.userName}>{user?.name || 'Administrator'}</div>
                <div className={styles.userRole}>System Admin</div>
              </div>
            </div>
          )}
          <button className={styles.logoutBtn} onClick={logout} title="Logout">
            <span style={{ fontSize: 16 }}>🚪</span>
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content (70% clean white workspace) */}
      <div className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <button className={styles.toggleBtn} onClick={() => setSidebarOpen(o => !o)} title="Toggle sidebar">
            {sidebarOpen ? '◀' : '▶'}
          </button>
          <h1 className={styles.pageTitle}>{currentTitle}</h1>
          <div className={styles.topbarRight}>
            <div className={styles.statusIndicator}>
              <div className={styles.statusDot} title="System active" />
              <span className={styles.statusText}>Live</span>
            </div>
            <span className={styles.envBadge}>Ocean Connect</span>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
