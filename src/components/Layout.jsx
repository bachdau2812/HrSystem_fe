import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = (user?.scope || user?.role || '').includes('ADMIN');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Close sidebar on outside click
  useEffect(() => {
    const handler = (e) => {
      if (sidebarOpen && !e.target.closest('.sidebar') && !e.target.closest('.hamburger')) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLink = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

  return (
    <div className={`app-layout${sidebarOpen ? ' sidebar-open' : ''}`}>
      {/* Overlay (mobile) */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Hamburger (mobile) */}
      <button className="hamburger" onClick={() => setSidebarOpen((o) => !o)} aria-label="Toggle menu">
        <span /><span /><span />
      </button>

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <span className="logo-icon">🏢</span>
          <span className="logo-text">HR System</span>
        </div>

        <nav className="sidebar-nav">
          {!isAdmin && (
            <>
              <NavLink to="/attendance" className={navLink}>
                <span className="nav-icon">📋</span>
                <span className="nav-label">Điểm danh</span>
              </NavLink>
              <NavLink to="/late-requests" className={navLink}>
                <span className="nav-icon">⏰</span>
                <span className="nav-label">Đơn xin muộn</span>
              </NavLink>
            </>
          )}
          {isAdmin && (
            <>
              <NavLink to="/admin/employees" className={navLink}>
                <span className="nav-icon">👥</span>
                <span className="nav-label">Nhân viên</span>
              </NavLink>
              <NavLink to="/admin/attendance" className={navLink}>
                <span className="nav-icon">📊</span>
                <span className="nav-label">Bảng điểm danh</span>
              </NavLink>
              <NavLink to="/admin/late-requests" className={navLink}>
                <span className="nav-icon">📝</span>
                <span className="nav-label">Đơn xin muộn</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar-circle">
              {(user?.sub || user?.username || 'U')[0].toUpperCase()}
            </div>
            <div className="user-text">
              <div className="user-name">{user?.sub || user?.username || 'Người dùng'}</div>
              <div className="user-role">{isAdmin ? 'Quản trị viên' : 'Nhân viên'}</div>
            </div>
          </div>
          <button className="btn btn-logout btn-sm" onClick={handleLogout}>
            <span>🚪</span> Đăng xuất
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
