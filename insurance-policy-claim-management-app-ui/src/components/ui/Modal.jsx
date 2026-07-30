import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        focusableElements[0].focus();
      }

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          if (onCloseRef.current) onCloseRef.current();
        } else if (e.key === 'Tab') {
          if (!focusableElements || focusableElements.length === 0) return;
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div 
        className="modal-backdrop show" 
        style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1070 }}
      ></div>
      <div 
        className="modal show d-block" 
        style={{ zIndex: 1075 }}
        tabIndex="-1" 
        role="dialog" 
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="modal-dialog modal-dialog-centered" ref={modalRef}>
          <div className="modal-content shadow-lg border-0">
            <div className="modal-header border-bottom-0 pb-0">
              <h5 className="modal-title fw-bold" id="modal-title">{title}</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose} 
                aria-label="Close modal"
              ></button>
            </div>
            <div className="modal-body py-4">
              {children}
            </div>
            {footer && (
              <div className="modal-footer border-top-0 pt-0">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default Modal;
