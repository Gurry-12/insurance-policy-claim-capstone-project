import React from 'react';
import { Search, Filter, Calendar } from 'lucide-react';

const ClaimSearchAndFilter = ({ 
  searchQuery, 
  setSearchQuery, 
  statusFilter, 
  setStatusFilter, 
  sortBy,
  setSortBy
}) => {
  return (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
      <div className="card-body p-3">
        <div className="row g-3 align-items-center">
          <div className="col-lg-6">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <Search size={18} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search by claim number, policy number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="col-lg-6">
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
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="RECOMMENDED_FOR_APPROVAL">Recommended (Approval)</option>
                  <option value="RECOMMENDED_FOR_REJECTION">Recommended (Rejection)</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
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
                  <option value="amount_high">Amount (High-Low)</option>
                  <option value="amount_low">Amount (Low-High)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimSearchAndFilter;
