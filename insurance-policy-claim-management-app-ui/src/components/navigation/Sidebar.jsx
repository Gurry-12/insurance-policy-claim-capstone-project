import { NavLink, useNavigate } from "react-router-dom";
import { notify } from "../../utils/notificationService";
import useAuth from "../../hooks/useAuth";
import SpecialityBadge from "../ui/SpecialityBadge";
import logoImg from "../../assets/logo/insurance-heart-vector.png";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

const Sidebar = ({ navItems, isOpen, setIsOpen, isCollapsed, setIsCollapsed, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    notify.success("Logged out successfully!");
    navigate("/login", { replace: true });
  };

  return (
    <>
      <aside className={`ip-sidebar ${isCollapsed ? 'collapsed' : ''} ${isOpen ? 'mobile-open' : ''}`}>
        {/* Brand */}
        <div className="ip-sidebar-header">
          {!isCollapsed ? (
            <>
              <div className="ip-sidebar-brand">
                <img 
                  src={logoImg} 
                  alt="InsureFlow Logo" 
                  className="ip-sidebar-logo"
                />
                <div className="ip-sidebar-portal-name">{title}</div>
              </div>
              {/* Desktop Toggle (Collapse) */}
              <button 
                className="ip-sidebar-toggle d-none d-md-flex" 
                onClick={() => setIsCollapsed(true)}
                title="Collapse sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            </>
          ) : (
            <div className="d-flex justify-content-center w-100">
              {/* Desktop Toggle (Expand) */}
              <button 
                className="ip-sidebar-toggle d-none d-md-flex" 
                onClick={() => setIsCollapsed(false)}
                title="Expand sidebar"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          
          {/* Mobile Toggle / Close (Back Icon) */}
          <button 
            className="ip-sidebar-toggle d-md-none ms-auto" 
            onClick={() => setIsOpen(false)}
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <i className="bi bi-arrow-left" style={{ fontSize: "1.15rem" }} />
          </button>
        </div>

        {/* Nav */}
        <nav className="ip-sidebar-nav">
          {navItems
            .filter((item) => {
              if (user?.role === "INTERNAL_STAFF" && user?.productSpeciality && item.speciality) {
                return item.speciality === user.productSpeciality || user.productSpeciality === "ALL";
              }
              return true;
            })
            .map(({ to, icon, label, end, section }, idx, arr) => {
            const prevSection = idx > 0 ? arr[idx - 1].section : undefined;
            const showSection = !isCollapsed && section && section !== prevSection;
            return (
              <span key={to}>
                {showSection && (
                  <div className="ip-nav-section">{section}</div>
                )}
                <NavLink
                  to={to}
                  end={end}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => `ip-nav-item ${isActive ? "active" : ""}`}
                  title={label}
                  aria-label={label}
                >
                  <i className={`bi ${icon}`} style={{ fontSize: "1.1rem", width: 22, textAlign: "center" }} />
                  {!isCollapsed && <span>{label}</span>}
                </NavLink>
              </span>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="ip-sidebar-footer">
          <div className="ip-sidebar-user">
            <div className="ip-sidebar-avatar">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            {!isCollapsed && (
              <div className="ip-sidebar-user-info">
                <div className="ip-sidebar-user-name" title={user?.name}>
                  {user?.name ?? "User"}
                </div>
                <div className="ip-sidebar-user-role" title={user?.email}>
                  {user?.email}
                </div>
                {user?.role === "INTERNAL_STAFF" && user?.productSpeciality && (
                  <SpecialityBadge speciality={user.productSpeciality} size="sm" className="mt-1" />
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="ip-sidebar-logout mt-2"
            title="Logout"
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="ip-sidebar-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
