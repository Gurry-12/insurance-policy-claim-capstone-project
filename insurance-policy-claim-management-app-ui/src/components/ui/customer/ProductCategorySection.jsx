import React, { useState } from 'react';
import CustomerProductCard from './CustomerProductCard';

const getCategoryIcon = (type) => {
  switch (type?.toUpperCase()) {
    case 'HEALTH': return 'bi-heart-pulse';
    case 'MOTOR': return 'bi-car-front';
    case 'LIFE': return 'bi-shield-check';
    case 'TRAVEL': return 'bi-airplane';
    case 'HOME': return 'bi-house';
    default: return 'bi-box';
  }
};

const ProductCategorySection = ({ categoryName, products }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!products || products.length === 0) return null;

  return (
    <div className="mb-5">
      <div 
        className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-2"
        style={{ cursor: 'pointer' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="mb-0 fw-bold d-flex align-items-center text-dark">
          <i className={`bi ${getCategoryIcon(categoryName)} me-2 text-primary`}></i>
          {categoryName} Insurance
          <span className="badge bg-secondary ms-3" style={{ fontSize: '0.8rem', borderRadius: '12px' }}>
            {products.length} {products.length === 1 ? 'Product' : 'Products'}
          </span>
        </h4>
        <button className="btn btn-sm btn-light border-0">
          <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
        </button>
      </div>

      {isExpanded && (
        <div className="row g-4 animate-fade-in">
          {products.map(product => (
            <div key={product.productId} className="col-md-6 col-lg-4 col-xl-3">
              <CustomerProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductCategorySection;
