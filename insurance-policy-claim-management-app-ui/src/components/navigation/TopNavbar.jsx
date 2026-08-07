import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import ThemeSwitcher from '../ui/ThemeSwitcher';

const TopNavbar = ({ onMenuClick, breadcrumb }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getBreadcrumb = () => {
    if (breadcrumb) return breadcrumb;
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0) return user?.role ? `${user.role.charAt(0) + user.role.slice(1).toLowerCase()} Portal` : 'Portal';
    return pathSegments.map(segment => segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(' / ');
  };

  return (
    <header className="ip-topbar px-4 align-items-center justify-content-between">
      {/* Left Section: Mobile menu button + Breadcrumb/Navigation */}
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn d-md-none p-1 text-secondary border-0"
          onClick={onMenuClick}
          aria-label="Toggle navigation"
        >
          <i className="bi bi-list fs-4" />
        </button>

        <div className="d-none d-md-flex align-items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-sm btn-light rounded-circle p-0 d-inline-flex align-items-center justify-content-center"
            style={{ width: 32, height: 32 }}
            title="Go Back"
            aria-label="Go Back"
          >
            <i className="bi bi-chevron-left small" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="btn btn-sm btn-light rounded-circle p-0 d-inline-flex align-items-center justify-content-center"
            style={{ width: 32, height: 32 }}
            title="Go Forward"
            aria-label="Go Forward"
          >
            <i className="bi bi-chevron-right small" />
          </button>
        </div>

        <span className="fw-medium text-muted small ms-2 d-none d-sm-block text-capitalize">
          {getBreadcrumb()}
        </span>
      </div>


      {/* Right Section: Actions + Profile */}
      <div className="d-flex align-items-center gap-3 ms-auto">
        

        {/* Theme Toggle */}
        <div className="d-none d-sm-block">
          <ThemeSwitcher />
        </div>
        
        <div className="vr bg-secondary opacity-25 mx-1 d-none d-sm-block" style={{ width: '1px', height: '24px' }}></div>
 
        {/* User Profile Info (Static/Restored) */}
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
            style={{
              width: 34,
              height: 34,
              background: 'linear-gradient(135deg, var(--ip-brand), var(--ip-secondary, #1e3a8a))',
              fontSize: '0.85rem'
            }}
          >
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="d-none d-sm-block text-start" style={{ lineHeight: 1.2 }}>
            <div className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
              {user?.name ?? 'User'}
            </div>
            <div className="text-muted text-capitalize" style={{ fontSize: '0.7rem' }}>
              {user?.role ? user.role.toLowerCase() : 'User'}
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};

export default TopNavbar;
