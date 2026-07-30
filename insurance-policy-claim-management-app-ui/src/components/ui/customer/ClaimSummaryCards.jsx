import React from 'react';
import { FileText, Clock, CheckCircle, XCircle, Search } from 'lucide-react';

const ClaimSummaryCards = ({ stats }) => {
  const cards = [
    {
      title: "Total Claims",
      value: stats.total || 0,
      icon: FileText,
      color: "primary",
      bg: "primary-subtle"
    },
    {
      title: "Submitted",
      value: stats.submitted || 0,
      icon: CheckCircle,
      color: "info",
      bg: "info-subtle"
    },
    {
      title: "Under Review",
      value: stats.underReview || 0,
      icon: Search,
      color: "warning",
      bg: "warning-subtle"
    },
    {
      title: "Approved",
      value: stats.approved || 0,
      icon: CheckCircle,
      color: "success",
      bg: "success-subtle"
    },
    {
      title: "Rejected",
      value: stats.rejected || 0,
      icon: XCircle,
      color: "danger",
      bg: "danger-subtle"
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="col-6 col-md-4 col-xl">
            <div className="card border-0 shadow-sm h-100 hover-elevate transition-all" style={{ borderRadius: '12px' }}>
              <div className="card-body p-3 d-flex align-items-center">
                <div className={`bg-${card.bg} text-${card.color} rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0`} style={{ width: '48px', height: '48px' }}>
                  <Icon size={24} />
                </div>
                <div>
                  <h6 className="text-muted small fw-semibold mb-1 text-uppercase tracking-wider">{card.title}</h6>
                  <h3 className="mb-0 fw-bold text-dark">{card.value}</h3>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ClaimSummaryCards;
