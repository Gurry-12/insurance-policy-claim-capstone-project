import React from 'react';
import { Search, Filter, Calendar, List } from 'lucide-react';

const PaymentSearchAndFilter = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  methodFilter,
  setMethodFilter,
  typeFilter,
  setTypeFilter,
  sortBy,
  setSortBy
}) => {
  return (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
      <div className="card-body p-3">
        <div className="row g-3 align-items-center">
          <div className="col-xl-4 col-lg-12">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <Search size={18} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search by ID, Policy, Plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="col-xl-8 col-lg-12">
            <div className="d-flex gap-2 flex-wrap">
              <div className="input-group" style={{ width: 'auto', flex: 1, minWidth: '130px' }}>
                <span className="input-group-text bg-light border-0">
                  <Filter size={16} className="text-muted" />
                </span>
                <select 
                  className="form-select border-0 bg-light px-1"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="SUCCESS">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>

              <div className="input-group" style={{ width: 'auto', flex: 1, minWidth: '130px' }}>
                <span className="input-group-text bg-light border-0">
                  <List size={16} className="text-muted" />
                </span>
                <select 
                  className="form-select border-0 bg-light px-1"
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                >
                  <option value="">All Methods</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="NET_BANKING">Net Banking</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
              
              <div className="input-group" style={{ width: 'auto', flex: 1, minWidth: '130px' }}>
                <span className="input-group-text bg-light border-0">
                  <Filter size={16} className="text-muted" />
                </span>
                <select 
                  className="form-select border-0 bg-light px-1"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">All Products</option>
                  <option value="HEALTH">Health</option>
                  <option value="MOTOR">Motor</option>
                  <option value="LIFE">Life</option>
                  <option value="TRAVEL">Travel</option>
                  <option value="HOME">Home</option>
                </select>
              </div>

              <div className="input-group" style={{ width: 'auto', flex: 1, minWidth: '150px' }}>
                <span className="input-group-text bg-light border-0">
                  <Calendar size={16} className="text-muted" />
                </span>
                <select 
                  className="form-select border-0 bg-light px-1"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount_high">Highest Amount</option>
                  <option value="amount_low">Lowest Amount</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSearchAndFilter;
