import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Calendar, ArrowRight, Upload, Clock } from 'lucide-react';
import StatusBadge from '../../ui/StatusBadge';

const CustomerClaimCard = ({ claim }) => {
  const navigate = useNavigate();

  const getCardGradient = (status) => {
    switch (status) {
      case "APPROVED": return "linear-gradient(135deg, var(--ip-claim-approved-bg) 0%, var(--ip-surface) 100%)";
      case "PENDING":
      case "UNDER_REVIEW":
      case "RECOMMENDED_FOR_APPROVAL":
      case "RECOMMENDED_FOR_REJECTION": return "linear-gradient(135deg, var(--ip-claim-under-review-bg) 0%, var(--ip-surface) 100%)";
      case "REJECTED": return "linear-gradient(135deg, var(--ip-claim-rejected-bg) 0%, var(--ip-surface) 100%)";
      default: return "linear-gradient(135deg, var(--ip-bg) 0%, var(--ip-surface) 100%)";
    }
  };

  const getCardBorder = (status) => {
    switch (status) {
      case "APPROVED": return "var(--ip-success-subtle)";
      case "PENDING":
      case "UNDER_REVIEW":
      case "RECOMMENDED_FOR_APPROVAL":
      case "RECOMMENDED_FOR_REJECTION": return "var(--ip-warning-subtle)";
      case "REJECTED": return "var(--ip-danger-subtle)";
      default: return "var(--ip-border)";
    }
  };

  const renderTimeline = (status) => {
    const stages = [
      { id: 'SUBMITTED', label: 'Submitted' },
      { id: 'REVIEW', label: 'Review' },
      { id: 'DECISION', label: 'Decision' }
    ];

    let currentStageIndex = 0;
    let decisionLabel = 'Decision';
    let decisionColor = 'text-muted';

    if (['UNDER_REVIEW', 'RECOMMENDED_FOR_APPROVAL', 'RECOMMENDED_FOR_REJECTION'].includes(status)) {
      currentStageIndex = 1;
    } else if (status === 'APPROVED') {
      currentStageIndex = 2;
      decisionLabel = 'Approved';
      decisionColor = 'text-success';
    } else if (status === 'REJECTED') {
      currentStageIndex = 2;
      decisionLabel = 'Rejected';
      decisionColor = 'text-danger';
    }

    return (
      <div className="d-flex justify-content-between align-items-center position-relative mt-3 mb-2 px-2">
        <div className="position-absolute w-100 bg-light" style={{ height: '4px', top: '10px', left: 0, zIndex: 1, borderRadius: '2px' }}>
          <div 
            className="bg-primary transition-all" 
            style={{ 
              height: '100%', 
              width: `${(currentStageIndex / 2) * 100}%`,
              borderRadius: '2px' 
            }} 
          />
        </div>
        
        {stages.map((stage, index) => {
          const isActive = index <= currentStageIndex;
          const isDecision = index === 2;
          
          return (
            <div key={stage.id} className="position-relative d-flex flex-column align-items-center" style={{ zIndex: 2 }}>
              <div 
                className={`rounded-circle d-flex align-items-center justify-content-center border border-2 ${isActive ? 'bg-primary border-primary text-white' : 'bg-white border-light text-muted'}`}
                style={{ width: '24px', height: '24px', transition: 'all 0.3s ease' }}
              >
                {isActive && <div className="bg-white rounded-circle" style={{ width: '8px', height: '8px' }} />}
              </div>
              <small 
                className={`mt-1 fw-semibold ${isActive ? (isDecision ? decisionColor : 'text-primary') : 'text-muted'}`} 
                style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}
              >
                {isDecision && isActive ? decisionLabel : stage.label}
              </small>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div 
      className="card border shadow-sm h-100" 
      style={{ 
        borderRadius: '16px', 
        background: getCardGradient(claim.claimStatus),
        borderColor: getCardBorder(claim.claimStatus),
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
      <div className="card-body p-4 pb-2">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <span className="badge bg-white text-dark border shadow-sm rounded-pill px-3 py-2 fw-medium mb-2 d-inline-flex align-items-center">
              <FileText size={14} className="me-2 text-primary" />
              #{claim.claimNumber || 'Pending'}
            </span>
            <div className="text-muted small mt-1">Policy: {claim.policyNumber}</div>
          </div>
          <StatusBadge status={claim.claimStatus} />
        </div>

        <div className="bg-white rounded-3 p-3 shadow-sm border mt-3 mb-2">
          <div className="row g-3">
            <div className="col-6">
              <div className="text-muted small mb-1 d-flex align-items-center">Claim Amount</div>
              <div className="fw-bold text-dark fs-5">₹{claim.claimAmount?.toLocaleString()}</div>
            </div>
            <div className="col-6 border-start">
              <div className="text-muted small mb-1 ps-2 d-flex align-items-center">Incident Date</div>
              <div className="fw-bold text-dark fs-6 ps-2 mt-1">
                {claim.incidentDate ? new Date(claim.incidentDate).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
        
        {renderTimeline(claim.claimStatus)}
      </div>

      <div className="card-footer bg-white border-top p-3 d-flex flex-column gap-2">
        <div className="d-flex justify-content-between text-muted small px-1 mb-2">
          <span>
            <Clock size={14} className="me-1 d-inline" /> 
            Submitted: {claim.createdDate ? new Date(claim.createdDate).toLocaleDateString() : '-'}
          </span>
        </div>
        
        <div className="d-flex gap-2">
          <button
            onClick={() => navigate(`/customer/claims/${claim.claimId}`)}
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
              {['SUBMITTED', 'UNDER_REVIEW'].includes(claim.claimStatus) && (
                <li>
                  <button className="dropdown-item d-flex align-items-center py-2 text-warning" onClick={() => navigate(`/customer/claims/upload/${claim.claimId}`)}>
                    <Upload size={16} className="me-2" /> Upload Docs
                  </button>
                </li>
              )}
              <li>
                <button className="dropdown-item d-flex align-items-center py-2" onClick={() => navigate(`/customer/claims/${claim.claimId}`)}>
                  <Clock size={16} className="me-2" /> Track Progress
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerClaimCard;
