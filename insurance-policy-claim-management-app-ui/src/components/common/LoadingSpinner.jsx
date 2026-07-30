const LoadingSpinner = ({ text = 'Loading\u2026' }) => (
  <div className="d-flex flex-column align-items-center justify-content-center py-5 gap-3">
    <div
      className="spinner-border"
      role="status"
      style={{ width: '2.25rem', height: '2.25rem', color: 'var(--ip-brand)', borderWidth: 3 }}
    >
      <span className="visually-hidden">Loading\u2026</span>
    </div>
    {text && (
      <span style={{ fontSize: '0.85rem', color: 'var(--ip-text-muted)' }}>{text}</span>
    )}
  </div>
);

export default LoadingSpinner;
