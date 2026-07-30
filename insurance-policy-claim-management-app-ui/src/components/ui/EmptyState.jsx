

const EmptyState = ({ icon = 'bi-inbox', title = 'No data found', message = 'There are no records to display here at the moment.' }) => (
  <div className="d-flex flex-column align-items-center justify-content-center py-5 px-3 text-center animate-slide-up w-100">
    <div 
      className="d-flex align-items-center justify-content-center rounded-circle mb-3"
      style={{
        width: 80,
        height: 80,
        backgroundColor: 'var(--ip-surface-raised)',
        color: 'var(--ip-text-muted)',
        border: '1px solid var(--ip-border)'
      }}
    >
      <i className={`bi ${icon}`} style={{ fontSize: '2.5rem' }} />
    </div>
    <h5 className="fw-semibold mb-2" style={{ color: 'var(--ip-text-primary)' }}>{title}</h5>
    <p style={{ color: 'var(--ip-text-muted)', fontSize: '0.9rem', maxWidth: 320 }}>
      {message}
    </p>
  </div>
);

export default EmptyState;
