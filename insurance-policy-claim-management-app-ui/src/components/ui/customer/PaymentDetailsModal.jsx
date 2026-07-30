import React from 'react';
import { Link } from 'react-router-dom';
import { Download, CreditCard, Shield, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import StatusBadge from '../../ui/StatusBadge';
import Modal from '../Modal';
import usePaymentPdf from '../../../hooks/PdfDownload/usePaymentPdf';

const PaymentDetailsModal = ({ isOpen, onClose, payment }) => {
  const { downloadReceipt } = usePaymentPdf();

  if (!payment) return null;

  const renderTimeline = () => {
    const isSuccess = payment.paymentStatus === 'SUCCESS';
    const isFailed = payment.paymentStatus === 'FAILED';
    const isPending = payment.paymentStatus === 'PENDING';
    const isRefunded = payment.paymentStatus === 'REFUNDED';

    const finalLabel = isSuccess ? 'Successful' : (isFailed ? 'Failed' : (isRefunded ? 'Refunded' : 'Processing'));
    const finalColor = isSuccess ? 'text-success' : (isFailed || isRefunded ? 'text-danger' : 'text-warning');
    const FinalIcon = isSuccess ? CheckCircle : (isFailed || isRefunded ? XCircle : Clock);

    return (
      <div className="d-flex justify-content-between align-items-center position-relative my-4 px-3">
        <div className="position-absolute w-100 bg-light" style={{ height: '4px', top: '16px', left: 0, zIndex: 1, borderRadius: '2px' }}>
          <div 
            className="bg-primary transition-all" 
            style={{ 
              height: '100%', 
              width: isPending ? '50%' : '100%',
              borderRadius: '2px' 
            }} 
          />
        </div>
        
        {/* Step 1 */}
        <div className="position-relative d-flex flex-column align-items-center" style={{ zIndex: 2 }}>
          <div className="rounded-circle d-flex align-items-center justify-content-center border border-2 bg-primary border-primary text-white" style={{ width: '36px', height: '36px' }}>
            <CheckCircle size={18} />
          </div>
          <small className="mt-2 fw-semibold text-primary">Initiated</small>
        </div>

        {/* Step 2 */}
        <div className="position-relative d-flex flex-column align-items-center" style={{ zIndex: 2 }}>
          <div className="rounded-circle d-flex align-items-center justify-content-center border border-2 bg-primary border-primary text-white" style={{ width: '36px', height: '36px' }}>
            {isPending ? <Clock size={18} /> : <CheckCircle size={18} />}
          </div>
          <small className="mt-2 fw-semibold text-primary">Processing</small>
        </div>

        {/* Step 3 */}
        <div className="position-relative d-flex flex-column align-items-center" style={{ zIndex: 2 }}>
          <div className={`rounded-circle d-flex align-items-center justify-content-center border border-2 ${isPending ? 'bg-white border-light text-muted' : 'bg-white border-light ' + finalColor}`} style={{ width: '36px', height: '36px' }}>
            {!isPending && <FinalIcon size={18} />}
          </div>
          <small className={`mt-2 fw-semibold ${isPending ? 'text-muted' : finalColor}`}>{finalLabel}</small>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Details" size="lg">
      <div className="p-3">
        {/* Header Section */}
        <div className="text-center mb-4 pb-3 border-bottom">
          <div className="mb-2">
            <StatusBadge status={payment.paymentStatus} />
          </div>
          <h2 className="fw-bold mb-1">₹{payment.amount?.toLocaleString()}</h2>
          <p className="text-muted mb-0">Paid via {payment.paymentMode?.replace('_', ' ')}</p>
          <div className="text-muted small mt-1">Transaction ID: {payment.transactionReference}</div>
          <div className="text-muted small mt-1">
            {payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : 'N/A'}
          </div>
        </div>

        {renderTimeline()}

        {/* Info Cards */}
        <div className="row g-4 mt-2">
          {/* Policy Information */}
          <div className="col-md-6">
            <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px', background: 'var(--ip-primary-subtle)' }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-3 text-primary">
                  <Shield size={20} className="me-2" />
                  <h6 className="mb-0 fw-bold">Policy Details</h6>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block">Policy Number</small>
                  <Link to={`/customer/policies/${payment.policyId}`} className="fw-semibold text-decoration-none">
                    {payment.policyNumber}
                  </Link>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block">Plan Name</small>
                  <div className="fw-medium">{payment._planName || 'N/A'}</div>
                </div>
                <div>
                  <small className="text-muted d-block">Product</small>
                  <div className="fw-medium">{payment._productName || 'N/A'} ({payment._productType || 'N/A'})</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="col-md-6">
            <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '12px', background: 'var(--ip-success-subtle)' }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-3 text-success">
                  <FileText size={20} className="me-2" />
                  <h6 className="mb-0 fw-bold">Payment Breakdown</h6>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Premium Amount</span>
                  <span className="fw-medium">₹{payment.amount?.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Taxes & Fees</span>
                  <span className="fw-medium text-muted">Included</span>
                </div>
                <hr className="my-2 border-success border-opacity-25" />
                <div className="d-flex justify-content-between">
                  <span className="fw-bold">Total Paid</span>
                  <span className="fw-bold">₹{payment.amount?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal Footer Actions */}
      <div className="modal-footer bg-light border-top-0 rounded-bottom-4 mt-4 py-3 d-flex gap-2">
        <button type="button" className="btn btn-outline-secondary px-4 rounded-pill" onClick={onClose}>
          Close
        </button>
        {payment.paymentStatus === 'SUCCESS' && (
          <button 
            type="button" 
            className="btn btn-primary px-4 rounded-pill d-inline-flex align-items-center"
            onClick={() => downloadReceipt(payment)}
          >
            <Download size={18} className="me-2" /> Download Receipt
          </button>
        )}
        {payment.paymentStatus === 'PENDING' && (
          <Link 
            to={`/customer/payments/pay/${payment.policyId}`}
            className="btn btn-warning text-dark px-4 rounded-pill d-inline-flex align-items-center"
          >
            <CreditCard size={18} className="me-2" /> Retry Payment
          </Link>
        )}
      </div>
    </Modal>
  );
};

export default PaymentDetailsModal;
