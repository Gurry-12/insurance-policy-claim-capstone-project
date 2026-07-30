import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Calendar, ArrowRight, Download, CreditCard, FileText } from 'lucide-react';
import StatusBadge from '../../ui/StatusBadge';
import usePolicyPdf from '../../../hooks/PdfDownload/usePolicyPdf';

const CustomerPolicyCard = ({ policy }) => {
  const navigate = useNavigate();
  const { downloadPolicy } = usePolicyPdf();

  const getCardGradient = (status) => {
    switch (status) {
      case "ACTIVE": return "linear-gradient(135deg, var(--ip-policy-active-bg) 0%, var(--ip-surface) 100%)";
      case "PENDING_PAYMENT": return "linear-gradient(135deg, var(--ip-policy-pending-bg) 0%, var(--ip-surface) 100%)";
      case "EXPIRED": return "linear-gradient(135deg, var(--ip-policy-expired-bg) 0%, var(--ip-surface) 100%)";
      case "CANCELLED": return "linear-gradient(135deg, var(--ip-policy-cancelled-bg) 0%, var(--ip-surface) 100%)";
      default: return "linear-gradient(135deg, var(--ip-bg) 0%, var(--ip-surface) 100%)";
    }
  };

  const getCardBorder = (status) => {
    switch (status) {
      case "ACTIVE": return "var(--ip-success-subtle)";
      case "PENDING_PAYMENT": return "var(--ip-warning-subtle)";
      case "EXPIRED": return "var(--ip-secondary-subtle)";
      case "CANCELLED": return "var(--ip-danger-subtle)";
      default: return "var(--ip-border)";
    }
  };

  const premiumType = policy.premiumType || "ONE_TIME";
  let hasPendingPayments = false;

  if (premiumType === "ONE_TIME") {
    hasPendingPayments = policy.policyStatus === "PENDING_PAYMENT";
  } else {
    const endDate = policy.endDate ? new Date(policy.endDate) : null;
    if (endDate && !isNaN(endDate.getTime())) {
      hasPendingPayments = new Date() <= endDate;
    }
  }

  const showPayButton =
    hasPendingPayments &&
    policy.policyStatus !== "CANCELLED" &&
    policy.policyStatus !== "EXPIRED";

  return (
    <div 
      className="card border shadow-sm h-100" 
      style={{ 
        borderRadius: '16px', 
        background: getCardGradient(policy.policyStatus),
        borderColor: getCardBorder(policy.policyStatus),
        transition: 'transform 0.2s, box-shadow 0.2s',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0,0,0,0.075)';
      }}
    >
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <span className="badge bg-white text-dark border shadow-sm rounded-pill px-3 py-2 fw-medium mb-2 d-inline-flex align-items-center">
              <Shield size={14} className="me-2 text-primary" />
              #{policy.policyNumber}
            </span>
            <h5 className="fw-bold text-dark mb-0 mt-1">{policy.planName}</h5>
            <small className="text-muted">{policy.productName}</small>
          </div>
          <StatusBadge status={policy.policyStatus} />
        </div>

        <div className="bg-white rounded-3 p-3 shadow-sm border mt-3 mb-4">
          <div className="row g-3">
            <div className="col-6">
              <div className="text-muted small mb-1 d-flex align-items-center">Premium</div>
              <div className="fw-bold text-dark fs-5">₹{policy.calculatedPremium?.toLocaleString()}</div>
              <small className="text-muted" style={{fontSize: '0.7rem'}}>{premiumType.replace('_', ' ')}</small>
            </div>
            <div className="col-6 border-start">
              <div className="text-muted small mb-1 ps-2 d-flex align-items-center">Coverage</div>
              <div className="fw-bold text-dark fs-5 ps-2">₹{policy.selectedCoverage?.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-footer bg-white border-top p-3 d-flex flex-column gap-2">
        <div className="d-flex justify-content-between text-muted small px-1 mb-2">
          <span>
            <Calendar size={14} className="me-1 d-inline" /> 
            Started: {policy.startDate ? new Date(policy.startDate).toLocaleDateString() : '-'}
          </span>
          <span>
            {policy.endDate ? `Expires: ${new Date(policy.endDate).toLocaleDateString()}` : 'Active Plan'}
          </span>
        </div>
        
        <div className="d-flex gap-2">
          <button
            onClick={() => navigate(`/customer/policies/${policy.policyId}`)}
            className="btn btn-primary flex-grow-1 py-2 d-inline-flex align-items-center justify-content-center"
            style={{ borderRadius: '8px' }}
          >
            View Details <ArrowRight size={16} className="ms-2" />
          </button>
          
          <div className="dropdown">
            <button className="btn btn-outline-secondary h-100 px-3" type="button" data-bs-toggle="dropdown" style={{ borderRadius: '8px' }}>
              <i className="bi bi-three-dots-vertical"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ borderRadius: '12px' }}>
              {showPayButton && (
                <li>
                  <button className="dropdown-item d-flex align-items-center py-2 text-success" onClick={() => navigate(`/customer/payments/pay/${policy.policyId}`)}>
                    <CreditCard size={16} className="me-2" /> Pay Premium
                  </button>
                </li>
              )}
              {policy.policyStatus === 'ACTIVE' && (
                <li>
                  <button className="dropdown-item d-flex align-items-center py-2" onClick={() => navigate(`/customer/claims/raise`)}>
                    <FileText size={16} className="me-2" /> Raise Claim
                  </button>
                </li>
              )}
              <li>
                <button className="dropdown-item d-flex align-items-center py-2" onClick={() => downloadPolicy(policy)}>
                  <Download size={16} className="me-2" /> Download Policy
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPolicyCard;
