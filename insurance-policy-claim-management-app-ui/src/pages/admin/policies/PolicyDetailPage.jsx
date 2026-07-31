import  { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import StatusBadge from '../../../components/ui/StatusBadge';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorAlert from '../../../components/ui/ErrorAlert';
import { getPolicyById, cancelPolicy } from '../../../services/policyService';
import toast from 'react-hot-toast';
import { getAllPaymentsPaginated } from '../../../services/paymentService';
import { getClaimsByPolicy } from '../../../services/policyService';
import usePolicyPdf from '../../../hooks/PdfDownload/usePolicyPdf';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import { formatINR } from '../../../utils/formatters';
const PolicyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { downloadPolicy } = usePolicyPdf();
  const [policy, setPolicy] = useState(null);
  const [payments, setPayments] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    Promise.all([
      getPolicyById(id),
      getAllPaymentsPaginated({ policyId: id, pageSize: 50 }).then(res => res.content).catch(() => []),
      getClaimsByPolicy(id).catch(() => [])
    ])
      .then(([policyData, paymentsData, claimsData]) => {
        setPolicy(policyData);
        setPayments(paymentsData);
        setClaims(claimsData);
      })
      .catch((err) => {
        console.error("Policy fetch error:", err);
        setError(err.message || err.message || 'Could not load policy details.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = () => {
    setShowCancelModal(false);
    setCancelling(true);
    cancelPolicy(id)
      .then(() => {
        toast.success('Policy cancelled successfully!');
        // Refresh details
        return getPolicyById(id).then(setPolicy);
      })
      .catch((err) => toast.error(err.message || 'Failed to cancel the policy.'))
      .finally(() => setCancelling(false));
  };

  if (loading) {
    return <LoadingSpinner text="Loading policy details..." />;
  }

  if (error || !policy) {
    return (
      <div>
        <PageHeader 
          title="Policy Details" 
          subtitle="Viewing policy details"
          onBack={() => navigate('/admin/policies')}
        />
        <ErrorAlert message={error || 'Policy not found.'} />
      </div>
    );
  }

  const customerName = policy.customerName || 'Customer';
  const planName = policy.planName || 'Insurance Plan';
  const premium = Number(policy.calculatedPremium || policy.totalPremiumPaid || 0);
  const status = (policy.policyStatus || 'ACTIVE').toUpperCase();
  const startDate = policy.startDate || (policy.issueDate ? new Date(policy.issueDate).toLocaleDateString('en-IN') : null) || 'N/A';
  const endDate = policy.endDate || (policy.expiryDate ? new Date(policy.expiryDate).toLocaleDateString('en-IN') : null) || 'N/A';
  const coverageAmount = Number(policy.selectedCoverage || 0);
  const premiumType = policy.premiumType || 'N/A';
  const productType = policy.productType || 'N/A';

  // Extract dynamic details, or fallback to core dynamic stats if array is empty
  const coverageDetails = (Array.isArray(policy.coverageDetails) && policy.coverageDetails.length > 0) 
    ? policy.coverageDetails 
    : [
        { benefit: 'Coverage Amount', detail: formatINR(coverageAmount) },
        { benefit: 'Remaining Claim Amount', detail: formatINR(policy.remainingClaimAmount ?? coverageAmount) },
        { benefit: 'Premium Term', detail: premiumType },
        { benefit: 'Product Category', detail: productType }
      ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <PageHeader 
        title="Policy Details" 
        subtitle={`Viewing details for Policy #${policy.policyNumber || 'Pending'}`}
        action={
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-danger d-inline-flex align-items-center gap-1"
              style={{ borderRadius: '8px' }}
              onClick={() => downloadPolicy(policy)}
            >
              <i className="bi bi-file-earmark-pdf"></i> PDF
            </button>
            <button onClick={() => navigate('/admin/policies')} className="btn btn-outline-secondary d-inline-flex align-items-center gap-1" style={{ borderRadius: '8px' }}>
              <i className="bi bi-arrow-left"></i> Back to Policies
            </button>
          </div>
        }
      />

      <div className="row g-4">
        {/* Left Side: Summary and Actions */}
        <div className="col-lg-4">
          <div className="card border-0 mb-4" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
            <div className="card-body p-4 text-center">
              <div className="mb-3 d-flex justify-content-center">
                <div style={{
                  width: 64, height: 64, borderRadius: 14, backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem'
                }}>
                  <i className="bi bi-file-earmark-text"></i>
                </div>
              </div>
              <h5 className="fw-bold mb-1">#{policy.policyNumber || 'Pending'}</h5>
              <p className="text-muted mb-3">{planName}</p>
              <div className="d-flex justify-content-center gap-2 mb-2">
                <StatusBadge status={status} />
              </div>

              <hr className="my-4" style={{ borderColor: 'var(--ip-border-light)' }} />

              <div className="text-start mb-4">
                <div className="mb-3">
                  <small className="text-muted d-block fw-bold">Premium Amount</small>
                  <span className="fs-5 fw-bold text-dark">{formatINR(premium)}</span>
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block fw-bold">Start Date</small>
                  <span>{startDate}</span>
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block fw-bold">Expiry Date</small>
                  <span>{endDate}</span>
                </div>
              </div>

              {status !== 'CANCELLED' && status !== 'EXPIRED' && (
                <button 
                  className="btn btn-outline-danger w-100 py-2 d-inline-flex align-items-center justify-content-center gap-2"
                  style={{ borderRadius: '8px' }}
                  onClick={() => setShowCancelModal(true)}
                  disabled={cancelling}
                >
                  <i className="bi bi-x-circle"></i>
                  {cancelling ? 'Cancelling...' : 'Cancel Policy'}
                </button>
              )}
            </div>
          </div>

          {/* Claims History Card */}
          <div className="card border-0 mb-4" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3 text-primary">
                <i className="bi bi-file-earmark-medical me-2"></i>Claims History
              </h6>
              
              {claims && claims.length > 0 ? (
                <div style={{ maxHeight: '300px', overflowY: 'auto', overflowX: 'auto' }}>
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
                      <tr style={{ color: 'var(--ip-text-muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                        <th className="border-0 bg-white">Claim Number</th>
                        <th className="border-0 bg-white">Amount</th>
                        <th className="border-0 bg-white">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claims.map((claim, idx) => (
                        <tr key={idx}>
                          <td className="fw-bold text-dark">{claim.claimNumber || 'Pending'}</td>
                          <td className="fw-bold">₹{Number(claim.claimAmount).toLocaleString('en-IN')}</td>
                          <td><StatusBadge status={claim.claimStatus} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-3 text-muted">
                  <i className="bi bi-inbox fs-4 d-block mb-2"></i>
                  No claims found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Plan Coverage & Customer Details */}
        <div className="col-lg-8">
          {/* Customer Card */}
          <div className="card border-0 mb-4" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3 text-primary">
                <i className="bi bi-person-fill me-2"></i>Customer Information
              </h6>
              <div className="row g-3">
                <div className="col-sm-6">
                  <small className="text-muted d-block">Full Name</small>
                  <span className="fw-bold">{customerName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coverage Details Card */}
          <div className="card border-0 mb-4" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3 text-primary">
                <i className="bi bi-shield-check me-2"></i>Coverage & Benefits
              </h6>
              
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ color: 'var(--ip-text-muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                      <th className="border-0 px-0">Benefit / Clause</th>
                      <th className="border-0 px-0">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverageDetails.map((detail, idx) => (
                      <tr key={idx}>
                        <td className="px-0 fw-bold text-dark" style={{ width: '40%' }}>{detail.benefit}</td>
                        <td className="px-0 text-muted">{detail.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Payment History Card */}
          <div className="card border-0" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3 text-primary">
                <i className="bi bi-receipt me-2"></i>Payment History
              </h6>
              
              {payments && payments.length > 0 ? (
                <div style={{ maxHeight: '300px', overflowY: 'auto', overflowX: 'auto' }}>
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
                      <tr style={{ color: 'var(--ip-text-muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                        <th className="border-0 bg-white">Transaction Ref</th>
                        <th className="border-0 bg-white">Date</th>
                        <th className="border-0 bg-white">Amount</th>
                        <th className="border-0 bg-white">Method</th>
                        <th className="border-0 bg-white">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment, idx) => (
                        <tr key={idx}>
                          <td className="fw-bold text-dark">{payment.transactionReference || 'Processing'}</td>
                          <td className="text-muted">{new Date(payment.paymentDate || payment.paymentTime).toLocaleDateString('en-IN')}</td>
                          <td className="fw-bold">₹{Number(payment.amount).toLocaleString('en-IN')}</td>
                          <td>{payment.paymentMode || 'N/A'}</td>
                          <td><StatusBadge status={payment.paymentStatus} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-3 text-muted">
                  <i className="bi bi-inbox fs-4 d-block mb-2"></i>
                  No payments found for this policy.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancel Policy"
        message="Are you sure you want to cancel this policy? This action cannot be undone."
        onConfirm={handleCancel}
        onCancel={() => setShowCancelModal(false)}
        confirmText="Yes, Cancel Policy"
        cancelText="No, Keep It"
        isDanger={true}
      />
    </div>
  );
};

export default PolicyDetailPage;
