import { useLocation, Link } from 'react-router-dom';

const routeLabels = {
  'dashboard':  'Dashboard',
  'admin':      'Admin',
  'agent':      'Agent',
  'staff':      'Staff',
  'customer':   'Customer',
  'products':   'Insurance Products',
  'plans':      'Policy Plans',
  'policies':   'Policies',
  'my':         'My Records',
  'all':        'All Records',
  'claims':     'Claims',
  'raise':      'Raise a Claim',
  'payments':   'Payments',
  'users':      'User Management',
  'profile':    'My Profile',
  'detail':     'Details',
};

const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  if (pathnames.length === 0) return null;

  return (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb mb-0" style={{ fontSize: '0.8125rem' }}>
        <li className="breadcrumb-item">
          <Link to="/" style={{ color: 'var(--ip-brand)', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
        </li>
        {pathnames.map((value, index) => {
          const isLast = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;

          let label = routeLabels[value.toLowerCase()];
          let isDynamic = false;
          
          if (!label) {
            // Check if it looks like an ID
            if (value.includes('-') || !isNaN(value)) {
              label = value;
              isDynamic = true;
            } else {
              // Capitalize first letter
              label = value.charAt(0).toUpperCase() + value.slice(1);
            }
          }

          return (
            <li 
              key={to} 
              className={`breadcrumb-item ${isLast ? 'active' : ''}`} 
              aria-current={isLast ? 'page' : undefined}
            >
              {isLast ? (
                <span className="fw-bold" style={{ color: 'var(--ip-text-primary)' }}>
                  {isDynamic && <i className="bi bi-hash text-muted me-1"></i>}
                  {label}
                </span>
              ) : (
                <Link to={to} style={{ color: 'var(--ip-brand)', textDecoration: 'none', fontWeight: 500 }}>
                  {isDynamic && <i className="bi bi-hash text-muted me-1"></i>}
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <style>{`
        .breadcrumb-item + .breadcrumb-item::before {
          content: "/";
          color: var(--ip-text-muted);
        }
      `}</style>
    </nav>
  );
};

export default Breadcrumb;
