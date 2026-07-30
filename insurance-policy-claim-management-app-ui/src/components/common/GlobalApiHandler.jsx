import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { notify } from '../../utils/notificationService';
import useAuth from '../../hooks/useAuth';

const GlobalApiHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  useEffect(() => {
    const handleUnauthorized = (event) => {
      const detail = event.detail;
      logout(true);
      if (location.pathname !== '/login') {
        if (detail && typeof detail === 'string') {
          notify.error(detail, 'Session expired. Please log in again.');
        } else {
          notify.error('Session expired. Please log in again.');
        }
        navigate('/login', { state: { from: location }, replace: true });
      }
    };

    const handleForbidden = () => {
      navigate('/unauthorized', { replace: true });
    };

    const handleApiError = (event) => {
      const message = event.detail || 'A network error occurred.';
      if (message !== 'canceled') {
        notify.error(message, `Error: ${message}`);
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('auth:forbidden', handleForbidden);
    window.addEventListener('api:error', handleApiError);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:forbidden', handleForbidden);
      window.removeEventListener('api:error', handleApiError);
    };
  }, [navigate, location, logout]);

  return null;
};

export default GlobalApiHandler;
