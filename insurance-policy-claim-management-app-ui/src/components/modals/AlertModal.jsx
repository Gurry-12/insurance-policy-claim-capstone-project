import { useEffect, useCallback } from 'react';

const AlertModal = ({ isOpen, title, message, onClose, type = 'info' }) => {
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const typeConfig = {
    info: { icon: 'bi-info-circle', color: 'text-primary' },
    success: { icon: 'bi-check-circle', color: 'text-success' },
    warning: { icon: 'bi-exclamation-triangle', color: 'text-warning' },
    error: { icon: 'bi-x-circle', color: 'text-danger' }
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
      <div 
        className="modal fade show d-block" 
        tabIndex="-1" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="alert-modal-title"
        style={{ zIndex: 1050 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0" style={{ borderRadius: '14px', boxShadow: 'var(--ip-shadow-xl)' }}>
            <div className="modal-header border-0 pb-0">
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>
            <div className="modal-body text-center pb-4 pt-0">
              <i className={`bi ${config.icon} ${config.color} d-block mb-3`} style={{ fontSize: '3.5rem', lineHeight: 1 }}></i>
              <h5 id="alert-modal-title" className="modal-title fw-bold mb-2">{title}</h5>
              <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>{message}</p>
              <button type="button" className="btn btn-primary px-4 py-2" onClick={onClose}>
                Okay
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AlertModal;
