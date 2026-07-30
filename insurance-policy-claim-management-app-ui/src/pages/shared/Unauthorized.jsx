import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { ROLE_HOME } from '../../utils/roles';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{ minHeight: '100vh', background: 'var(--ip-bg)', color: 'var(--ip-text-primary)' }}
    >
      <i className="bi bi-shield-x" style={{ fontSize: '4rem', color: '#ef4444' }} />
      <h1 className="fw-bold mt-3">Access Denied</h1>
      <p className="text-muted mb-4">You don&apos;t have permission to view this page.</p>
      <div className="mt-4">
        <button onClick={() => navigate(ROLE_HOME[user?.role] || '/')} className="btn btn-primary px-4 py-2 rounded-pill">
          <i className="bi bi-arrow-left me-2" />
          {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
