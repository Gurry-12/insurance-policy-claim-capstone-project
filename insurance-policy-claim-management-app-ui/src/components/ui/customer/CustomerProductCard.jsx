import { Link } from 'react-router-dom';

const getCategoryIcon = (type) => {
  switch (type?.toUpperCase()) {
    case 'HEALTH': return 'bi-heart-pulse text-danger';
    case 'MOTOR': return 'bi-car-front text-primary';
    case 'LIFE': return 'bi-shield-check text-success';
    case 'TRAVEL': return 'bi-airplane text-info';
    case 'HOME': return 'bi-house text-warning';
    default: return 'bi-box text-secondary';
  }
};

const CustomerProductCard = ({ product }) => {
  return (
    <div className="card h-100 border-0 shadow-sm hover-elevate transition-all" style={{ borderRadius: '12px', overflow: 'hidden' }}>
      {/* Optional image placeholder header */}
      <div className="bg-light d-flex align-items-center justify-content-center border-bottom" style={{ height: '140px' }}>
        <i className={`bi ${getCategoryIcon(product.productType).split(' ')[0]} fs-1 text-muted opacity-50`}></i>
      </div>
      
      <div className="card-body p-4 d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <span className="badge bg-light text-dark border px-2 py-1 mb-2">
             <i className={`bi ${getCategoryIcon(product.productType)} me-1`}></i>
             {product.productType}
          </span>
          <span className={`badge ${(product.isActive ?? product.active) ? 'bg-success-subtle text-success border-success-subtle' : 'bg-secondary-subtle text-secondary border-secondary-subtle'} border rounded-pill px-3 py-1`}>
            {(product.isActive ?? product.active) ? "Active" : "Inactive"}
          </span>
        </div>

        <h5 className="card-title text-dark fw-bold mb-3 line-clamp-1" title={product.productName}>
          {product.productName}
        </h5>

        <p className="card-text text-muted flex-grow-1 line-clamp-3 mb-4" style={{ fontSize: '0.9rem' }}>
          {product.description}
        </p>

        <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded mb-4">
          <div>
            <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Starting Premium</div>
            <div className="fw-bold text-dark fs-5">
              {product.minPremium ? `₹${product.minPremium.toLocaleString()}` : 'N/A'}
            </div>
          </div>
          <div className="text-end">
            <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Plans</div>
            <div className="fw-bold text-primary fs-5">
              {product.planCount || 0}
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <Link 
            to={`/customer/products/${product.productId}/plans`}
            className="btn btn-primary w-100"
            style={{ borderRadius: '8px', padding: '10px' }}
          >
            View Plans
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerProductCard;
