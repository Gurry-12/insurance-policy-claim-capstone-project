import { useNavigate } from 'react-router-dom';

const PageHeader = ({ title, subtitle, badge, actions, backPath }) => {
  const navigate = useNavigate();

  return (
    <div className="ip-page-header">
      <div className="d-flex align-items-start gap-3">
        {backPath && (
          <button 
            className="btn btn-icon btn-light text-muted border-0 mt-1"
            onClick={() => navigate(backPath)}
            title="Go back"
          >
            <i className="bi bi-arrow-left"></i>
          </button>
        )}
        <div>
          <div className="d-flex align-items-center gap-2">
            <h1 className="ip-page-title m-0">{title}</h1>
            {badge && <span className="badge bg-primary-subtle text-primary border border-primary-subtle">{badge}</span>}
          </div>
          {subtitle && <p className="ip-page-subtitle m-0">{subtitle}</p>}
        </div>
      </div>
      
      {actions && (
        <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
