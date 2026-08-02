import useAuth from "../../hooks/useAuth";

/**
 * Temporary placeholder shown for admin/staff/customer dashboards
 * until those sections are built out.
 */
const PlaceholderPage = ({ role }) => {
  const { user, logout } = useAuth();

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center gap-3"
      style={{
        minHeight: "100vh",
        background: "var(--ip-bg)",
        color: "var(--ip-text-primary)",
      }}
    >
      <i
        className="bi bi-stars"
        style={{ fontSize: "3.5rem", color: "var(--ip-brand)" }}
      />
      <h2 className="fw-bold mb-0">{role} Dashboard</h2>
      <p className="text-muted mb-1">
        Logged in as <strong>{user?.name || user?.email}</strong>
      </p>
      <span
        className="badge rounded-pill px-3 py-2"
        style={{
          background: "var(--ip-brand-light)",
          color: "var(--ip-brand)",
          fontSize: "0.85rem",
        }}
      >
        <i className="bi bi-person-fill me-1" />
        {user?.role}
      </span>
      <p className="text-muted small mt-2">
        This section is coming soon. Auth is working correctly ✓
      </p>
      <button
        className="btn btn-outline-danger rounded-pill px-4 mt-2"
        onClick={logout}
      >
        <i className="bi bi-box-arrow-right me-2" />
        Logout
      </button>
    </div>
  );
};

export default PlaceholderPage;
