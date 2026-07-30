import React from 'react';

const ProductSearchAndFilter = ({ 
  searchQuery, 
  setSearchQuery, 
  selectedType, 
  setSelectedType, 
  productTypes, 
  sortBy, 
  setSortBy 
}) => {
  return (
    <div className="card border-0 shadow-sm mb-5" style={{ borderRadius: '12px' }}>
      <div className="card-body p-4">
        <div className="row g-3">
          <div className="col-lg-6">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search products by name, description, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <select 
              className="form-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Categories</option>
              {productTypes.map(type => (
                <option key={type} value={type}>
                  {type} Insurance
                </option>
              ))}
            </select>
          </div>
          <div className="col-lg-3 col-md-6">
            <select 
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSearchAndFilter;
