

const ErrorAlert = ({ message, onDismiss }) => {
  if (!message) return null;
  return (
    <div
      className="d-flex align-items-center gap-3 mb-4 animate-shake"
      style={{
        background: 'var(--ip-danger-bg, #FEF2F2)', 
        border: '1px solid var(--ip-danger-border, #F87171)',
        borderRadius: 12, 
        padding: '0.85rem 1rem',
        color: 'var(--ip-danger, #B91C1C)', 
        fontSize: '0.875rem',
        boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.1)'
      }}
      role="alert"
    >
      <i className="bi bi-exclamation-octagon flex-shrink-0" style={{ fontSize: '1.25rem' }} />
      <span className="flex-grow-1 fw-medium">{message}</span>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="btn-close btn-close-white" 
          style={{ filter: 'invert(1) grayscale(100%) brightness(50%)', opacity: 0.6 }}
          aria-label="Close"
        />
      )}
    </div>
  );
};

export default ErrorAlert;
