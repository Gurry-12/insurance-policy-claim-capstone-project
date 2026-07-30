const StatCard = ({ title, label, value, icon, iconColor = 'var(--ip-brand)', color, trend, trendType = 'neutral', onClick }) => {
  const displayLabel = title || label;
  const displayIconColor = color || iconColor;
  
  const getTrendColor = () => {
    switch(trendType) {
      case 'up': return 'var(--ip-success)';
      case 'down': return 'var(--ip-danger)';
      default: return 'var(--ip-text-muted)';
    }
  };

  const getTrendIcon = () => {
    switch(trendType) {
      case 'up': return 'bi-arrow-up-right';
      case 'down': return 'bi-arrow-down-right';
      default: return 'bi-dash';
    }
  };

  return (
    <div 
      className="card border-0 h-100" 
      onClick={onClick}
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 'var(--ip-radius-md)',
        boxShadow: 'var(--ip-shadow-sm)'
      }}
    >
      <div className="card-body p-4 d-flex flex-column h-100">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <h6 className="text-muted fw-medium m-0" style={{ fontSize: '0.875rem' }}>{displayLabel}</h6>
          <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, backgroundColor: 'var(--ip-surface-raised)', color: displayIconColor }}>
            <i className={`bi ${icon} fs-5`}></i>
          </div>
        </div>
        
        <div className="mt-auto">
          <h3 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.02em' }}>{value}</h3>
          
          {trend && (
            <div className="d-flex align-items-center gap-1 mt-2" style={{ fontSize: '0.75rem' }}>
              <span className="fw-bold d-flex align-items-center" style={{ color: getTrendColor() }}>
                <i className={`bi ${getTrendIcon()} me-1`}></i>
                {trend}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
