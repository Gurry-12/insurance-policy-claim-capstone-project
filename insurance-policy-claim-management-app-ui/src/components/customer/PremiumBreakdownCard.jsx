import { Shield, Clock, IndianRupee } from 'lucide-react';

const PremiumBreakdownCard = ({ quoteDetails }) => {
  if (!quoteDetails) return null;

  return (
    <div className="border-0 rounded-3 overflow-hidden" style={{ boxShadow: 'var(--ip-shadow-sm)' }}>
      {/* Header with coverage info */}
      {(quoteDetails.selectedCoverage || quoteDetails.coverageAmount) && (
        <div className="p-3" style={{ backgroundColor: 'var(--ip-brand-light, #f0f9ff)', borderBottom: '1px solid var(--ip-brand-muted, #e0f2fe)' }}>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <Shield size={16} className="text-primary" />
              <span className="small text-muted">Coverage</span>
              <span className="fw-bold text-primary">
                ₹{(quoteDetails.selectedCoverage || quoteDetails.coverageAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            {(quoteDetails.duration || quoteDetails.term) && (
              <div className="d-flex align-items-center gap-2">
                <Clock size={16} className="text-muted" />
                <span className="small text-muted">Term</span>
                <span className="fw-bold">{quoteDetails.duration || quoteDetails.term} Year(s)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium breakdown */}
      <div className="p-3 bg-white">
        <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
          <h6 className="fw-bold mb-0">
            <IndianRupee size={14} className="me-1" />
            Premium Breakdown
          </h6>
          <span className={`badge ${quoteDetails.premiumType === 'ONE_TIME' ? 'bg-success' : 'bg-primary'}`}>
            {quoteDetails.premiumType === 'ONE_TIME' ? '● One-Time Upfront' : '● Annual (Every Year)'}
          </span>
        </div>
        
        {/* Base Annual Calculation */}
        <div className="mb-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="text-muted small">Base Risk Premium</span>
            <span className="fw-semibold">
              ₹{(quoteDetails.basePremium || quoteDetails.annualPremium || 0).toLocaleString('en-IN')}
            </span>
          </div>
          
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="text-muted small">Processing Fee</span>
            <span className="fw-semibold">
              ₹{(quoteDetails.processingFee || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="text-muted small">GST</span>
            <span className="fw-semibold">
              ₹{(quoteDetails.gst || quoteDetails.taxAmount || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="d-flex align-items-center justify-content-between pt-2 border-top">
            <span className="text-muted fw-semibold small">Annual Premium</span>
            <span className="fw-bold text-dark">
              ₹{(quoteDetails.annualPremium || quoteDetails.totalPremium || 0).toLocaleString('en-IN')} / year
            </span>
          </div>
        </div>

        {/* Commitment & Discounts based on Payment Mode */}
        {quoteDetails.premiumType === 'ONE_TIME' ? (
          <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--ip-brand-light, #f0f9ff)', border: '1px solid var(--ip-brand-muted, #bae6fd)' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted">Original ({quoteDetails.duration || 1} Years)</span>
              <span className="fw-semibold text-muted text-decoration-line-through">
                ₹{(quoteDetails.totalCommitment || ((quoteDetails.annualPremium || 0) * (quoteDetails.duration || 1))).toLocaleString('en-IN')}
              </span>
            </div>
            
            <div className="d-flex align-items-center justify-content-between mb-2 text-success">
              <span className="small fw-semibold">
                Duration Discount {quoteDetails.discountPercentage ? `(${quoteDetails.discountPercentage}%)` : ''}
              </span>
              <span className="fw-bold">
                - ₹{(quoteDetails.discountAmount || quoteDetails.oneTimeDiscount || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <hr className="my-2" />

            <div className="d-flex align-items-center justify-content-between">
              <span className="fw-bold text-dark">Final Upfront Premium</span>
              <span className="fw-bold text-primary fs-5">
                ₹{(quoteDetails.totalPremium || quoteDetails.finalPremium || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--ip-surface-raised, #f8fafc)', border: '1px solid #e2e8f0' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted">Payment Frequency</span>
              <span className="fw-semibold">Every Year</span>
            </div>
            
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted">Total Commitment ({quoteDetails.duration || 1} Years)</span>
              <span className="fw-semibold">
                ₹{(quoteDetails.totalCommitment || ((quoteDetails.annualPremium || quoteDetails.totalPremium || 0) * (quoteDetails.duration || 1))).toLocaleString('en-IN')}
              </span>
            </div>

            <hr className="my-2" />

            <div className="d-flex align-items-center justify-content-between">
              <span className="fw-bold text-dark">Annual Premium Due</span>
              <span className="fw-bold text-primary fs-5">
                ₹{(quoteDetails.totalPremium || quoteDetails.annualPremium || 0).toLocaleString('en-IN')} / yr
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumBreakdownCard;
