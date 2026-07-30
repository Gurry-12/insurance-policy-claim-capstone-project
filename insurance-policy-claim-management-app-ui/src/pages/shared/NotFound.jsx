import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { ROLE_HOME } from "../../utils/roles";

const NotFound = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{
        minHeight: "100vh",
        background: "var(--ip-bg)",
        color: "var(--ip-text-primary)",
      }}
    >
      <i
        className="bi bi-map"
        style={{ fontSize: "4rem", color: "var(--ip-text-muted)" }}
      />
      <h1 className="fw-bold mt-3" style={{ fontSize: "4rem", lineHeight: 1 }}>
        404
      </h1>
      <p className="text-muted mb-4">Oops - page not found.</p>
      <button
        onClick={() =>
          navigate(
            isAuthenticated && user ? (ROLE_HOME[user.role] ?? "/") : "/login",
          )
        }
        className="btn btn-primary px-4 py-2 rounded-pill"
      >
        <i className="bi bi-arrow-left me-2" />
        {isAuthenticated ? "Go to Dashboard" : "Go to Login"}
      </button>
    </div>
  );
};

export default NotFound;
