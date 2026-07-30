import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const Drawer = ({ isOpen, onClose, title, children, width = '700px' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="ip-drawer-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Drawer'}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 1060,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'ipFadeIn 0.2s ease-out'
      }}
    >
      <div
        className="ip-drawer-content"
        style={{
          width: `min(${width}, 100vw)`,
          maxWidth: '100%',
          backgroundColor: 'var(--ip-surface)',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 25px rgba(0,0,0,0.1)',
          animation: 'ipSlideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {title && (
          <div 
            className="ip-drawer-header"
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--ip-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--ip-surface)'
            }}
          >
            <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 600, color: 'var(--ip-text-primary)' }}>{title}</h2>
            <button 
              className="btn btn-icon border-0 bg-transparent" 
              onClick={onClose}
              aria-label="Close drawer"
              style={{ color: 'var(--ip-text-muted)' }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        )}
        {!title && (
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
            <button 
              className="btn btn-icon border-0 bg-transparent" 
              onClick={onClose}
              aria-label="Close drawer"
              style={{ color: 'var(--ip-text-muted)' }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        )}
        <div 
          className="ip-drawer-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0',
            backgroundColor: 'var(--ip-bg)'
          }}
        >
          {children}
        </div>
      </div>
      <style>{`
        @keyframes ipSlideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes ipFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default Drawer;
