import { Link } from 'react-router-dom';

const DashboardCard = ({ icon, label, value, color, to, delta }) => {
  const content = (
    <div
      className="card border-0 h-100 hover-lift animate-slide-up"
      style={{
        borderRadius: 16,
        cursor: to ? 'pointer' : 'default',
        boxShadow: 'var(--ip-shadow-md)',
        overflow: 'hidden',
      }}
    >
      <div className="card-body d-flex align-items-center gap-3 p-4">
        <div
          style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <i className={`bi ${icon}`} style={{ fontSize: '1.4rem', color }} />
        </div>
        <div>
          <div
            style={{
              fontSize: '1.7rem', fontWeight: 700,
              color: 'var(--ip-text-primary)', lineHeight: 1.1,
            }}
          >
            {value ?? <span className="placeholder col-6" />}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--ip-text-muted)', marginTop: 2 }}>
            {label}
          </div>
          {delta !== undefined && (
            <div
              style={{
                fontSize: '0.72rem', marginTop: 4, fontWeight: 600,
                color: delta >= 0 ? 'var(--ip-success)' : 'var(--ip-danger)',
              }}
            >
              <i className={`bi bi-arrow-${delta >= 0 ? 'up' : 'down'}-short`} />
              {Math.abs(delta)}% this month
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return to ? (
    <Link to={to} className="text-decoration-none d-block">{content}</Link>
  ) : (
    content
  );
};

export default DashboardCard;
