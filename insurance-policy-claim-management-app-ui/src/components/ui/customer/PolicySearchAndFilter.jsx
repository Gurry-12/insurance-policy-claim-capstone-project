import React from 'react';
import { Search, Filter, Calendar } from 'lucide-react';

const PolicySearchAndFilter = ({ 
  searchQuery, 
  setSearchQuery, 
  statusFilter, 
  setStatusFilter, 
  typeFilter, 
  setTypeFilter,
  sortBy,
  setSortBy
}) => {
  return (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
      <div className="card-body p-3">
        <div className="row g-3 align-items-center">
          <div className="col-lg-4">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <Search size={18} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search by policy number, plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="col-lg-8">
            <div className="d-flex gap-2 flex-wrap">
              <div className="input-group" style={{ width: 'auto', flex: 1, minWidth: '150px' }}>
                <span className="input-group-text bg-light border-0">
                  <Filter size={16} className="text-muted" />
                </span>
                <select 
                  className="form-select border-0 bg-light"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING_PAYMENT">Pending</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="input-group" style={{ width: 'auto', flex: 1, minWidth: '150px' }}>
                <span className="input-group-text bg-light border-0">
                  <Filter size={16} className="text-muted" />
                </span>
                <select 
                  className="form-select border-0 bg-light"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="HEALTH">Health</option>
                  <option value="LIFE">Life</option>
                  <option value="MOTOR">Motor</option>
                  <option value="TRAVEL">Travel</option>
                  <option value="HOME">Home</option>
                </select>
              </div>
              
              <div className="input-group" style={{ width: 'auto', flex: 1, minWidth: '150px' }}>
                <span className="input-group-text bg-light border-0">
                  <Calendar size={16} className="text-muted" />
                </span>
                <select 
                  className="form-select border-0 bg-light"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="premium_high">Premium (High-Low)</option>
                  <option value="premium_low">Premium (Low-High)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicySearchAndFilter;
