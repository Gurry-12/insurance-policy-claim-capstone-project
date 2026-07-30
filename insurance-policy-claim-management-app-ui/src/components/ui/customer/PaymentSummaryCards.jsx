import React from 'react';
import { IndianRupee, Clock, Shield, Calendar, Receipt } from 'lucide-react';

const PaymentSummaryCards = ({ stats }) => {
  const cards = [
    {
      title: "Total Paid",
      value: `₹${(stats.totalPaid || 0).toLocaleString()}`,
      icon: IndianRupee,
      color: "success",
      bg: "success-subtle"
    },
    {
      title: "Total Payments",
      value: stats.totalPayments || 0,
      icon: Receipt,
      color: "primary",
      bg: "primary-subtle"
    },
    {
      title: "Pending Premium",
      value: `₹${(stats.pendingAmount || 0).toLocaleString()}`,
      icon: Clock,
      color: "warning",
      bg: "warning-subtle"
    },
    {
      title: "Next Due Date",
      value: stats.nextDueDate ? new Date(stats.nextDueDate).toLocaleDateString() : 'N/A',
      icon: Calendar,
      color: "info",
      bg: "info-subtle"
    },
    {
      title: "Active Policies",
      value: stats.activePolicies || 0,
      icon: Shield,
      color: "secondary",
      bg: "secondary-subtle"
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
                  <h4 className="mb-0 fw-bold text-dark">{card.value}</h4>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PaymentSummaryCards;
