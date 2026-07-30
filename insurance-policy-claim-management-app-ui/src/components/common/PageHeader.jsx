import { useNavigate } from 'react-router-dom';

const PageHeader = ({ title, subtitle, action, onBack }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="ip-page-header">
      <div className="d-flex align-items-start gap-3">
        {onBack !== false && (
          <button
            onClick={handleBack}
            className="btn btn-icon border-0 mt-1"
            style={{ color: 'var(--ip-text-muted)', flexShrink: 0 }}
            title="Go back"
          >
            <i className="bi bi-arrow-left"></i>
          </button>
        )}
        <div>
          <h1 className="ip-page-title">{title}</h1>
          {subtitle && <p className="ip-page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

export default PageHeader;
