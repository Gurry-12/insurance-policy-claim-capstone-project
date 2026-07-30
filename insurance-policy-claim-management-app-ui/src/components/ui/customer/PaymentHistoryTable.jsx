import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, CreditCard, Eye, FileText, MoreVertical } from 'lucide-react';
import StatusBadge from '../../ui/StatusBadge';

const PaymentHistoryTable = ({ payments, onActionClick, onDownloadClick }) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop Table View */}
      <div className="table-responsive d-none d-md-block pb-5">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="py-3 px-4 text-muted small text-uppercase tracking-wider fw-semibold border-0 rounded-start-3">Transaction</th>
              <th className="py-3 px-4 text-muted small text-uppercase tracking-wider fw-semibold border-0">Policy & Product</th>
              <th className="py-3 px-4 text-muted small text-uppercase tracking-wider fw-semibold border-0 text-end">Amount</th>
              <th className="py-3 px-4 text-muted small text-uppercase tracking-wider fw-semibold border-0 text-center">Status</th>
              <th className="py-3 px-4 text-muted small text-uppercase tracking-wider fw-semibold border-0">Date</th>
              <th className="py-3 px-4 border-0 rounded-end-3"></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.paymentId} className="border-bottom">
                <td className="py-3 px-4">
                  <div className="fw-semibold text-dark">{payment.transactionReference}</div>
                  <div className="small text-muted">{payment.paymentMode?.replace('_', ' ')}</div>
                </td>
                <td className="py-3 px-4">
                  <Link to={`/customer/policies/${payment.policyId}`} className="fw-bold text-decoration-none text-primary d-block">
                    {payment.policyNumber}
                  </Link>
                  <div className="small text-muted text-truncate" style={{ maxWidth: '250px' }}>
                    {payment._planName || 'Unknown Plan'} • {payment._productType || 'Unknown'}
                  </div>
                </td>
                <td className="py-3 px-4 text-end">
                  <div className="fw-bold text-dark">₹{payment.amount?.toLocaleString()}</div>
                  <div className="small text-muted">Incl. Taxes</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <StatusBadge status={payment.paymentStatus} />
                </td>
                <td className="py-3 px-4">
                  <div className="text-dark">{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}</div>
                  <div className="small text-muted">{payment.paymentDate ? new Date(payment.paymentDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</div>
                </td>
                <td className="py-3 px-4 text-end">
                  <div className="dropdown">
                    <button className="btn btn-light btn-sm rounded-circle p-2" type="button" data-bs-toggle="dropdown">
                      <MoreVertical size={16} />
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ borderRadius: '12px' }}>
                      <li>
                        <button className="dropdown-item d-flex align-items-center py-2" onClick={() => onActionClick(payment)}>
                          <Eye size={16} className="me-2 text-muted" /> View Details
                        </button>
                      </li>
                      <li>
                        <Link className="dropdown-item d-flex align-items-center py-2" to={`/customer/policies/${payment.policyId}`}>
                          <FileText size={16} className="me-2 text-muted" /> View Policy
                        </Link>
                      </li>
                      {payment.paymentStatus === 'SUCCESS' && (
                        <li>
                          <button className="dropdown-item d-flex align-items-center py-2 text-primary" onClick={() => onDownloadClick(payment)}>
                            <Download size={16} className="me-2" /> Download Receipt
                          </button>
                        </li>
                      )}
                      {payment.paymentStatus === 'PENDING' && (
                        <li>
                          <button className="dropdown-item d-flex align-items-center py-2 text-warning" onClick={() => navigate(`/customer/payments/pay/${payment.policyId}`)}>
                            <CreditCard size={16} className="me-2" /> Pay Pending
                          </button>
                        </li>
                      )}
                    </ul>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="d-block d-md-none">
        <div className="d-flex flex-column gap-3">
          {payments.map((payment) => (
            <div key={payment.paymentId} className="card border shadow-sm" style={{ borderRadius: '12px' }}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <StatusBadge status={payment.paymentStatus} />
                  <div className="fw-bold fs-5">₹{payment.amount?.toLocaleString()}</div>
                </div>
                
                <div className="mb-3">
                  <div className="text-muted small">Ref: {payment.transactionReference}</div>
                  <Link to={`/customer/policies/${payment.policyId}`} className="fw-bold text-decoration-none">
                    Policy: {payment.policyNumber}
                  </Link>
                </div>
                
                <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-3">
                  <div className="small text-muted">
                    {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => onActionClick(payment)}>
                      Details
                    </button>
                    {payment.paymentStatus === 'SUCCESS' && (
                      <button className="btn btn-sm btn-primary" onClick={() => onDownloadClick(payment)}>
                        Receipt
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default PaymentHistoryTable;
