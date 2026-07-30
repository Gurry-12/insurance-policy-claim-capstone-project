import { Link } from 'react-router-dom';

const BentoCard = ({ icon, iconColor, title, linkTo, linkLabel, children, className = '', style, ...rest }) => {
  return (
    <div className={`ip-bento-card ${className}`} style={style} {...rest}>
      <div className="ip-bento-card-bg" />
      <div className="ip-bento-card-body">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="ip-bento-card-title">
            {icon && <i className={`bi ${icon} me-2`} style={{ color: iconColor }} />}
            {title}
          </h6>
          {linkTo && (
            <Link to={linkTo} className="ip-bento-card-link">
              {linkLabel ?? 'View all'} <i className="bi bi-arrow-right" />
            </Link>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default BentoCard;
