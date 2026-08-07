import React, { useState, useEffect } from 'react';
import { getPricingRuleHistory } from '../../services/pricingRuleService';
import { notify } from '../../utils/notificationService';
import EmptyState from "../ui/EmptyState";

const PricingRuleHistoryModal = ({ ruleId, isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && ruleId) {
      const fetchHistory = async () => {
        setLoading(true);
        try {
          const res = await getPricingRuleHistory(ruleId);
          setHistory(res.data || res);
        } catch (error) {
          notify.error("Failed to load pricing rule history");
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen, ruleId]);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header bg-light border-bottom-0">
              <h5 className="modal-title fw-bold">
                <i className="bi bi-clock-history me-2 text-primary"></i>
                Pricing Rule Audit Trail
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            
            <div className="modal-body p-4">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status"></div>
                  <p className="mt-2 text-muted">Loading audit history...</p>
                </div>
              ) : history.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="bg-surface">
                      <tr>
                        <th>No.</th>
                        <th>Date</th>
                        <th>Base Rate</th>
                        <th>Proc. Fee</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((record, index) => (
                        <tr key={index}>
                          <td><span className="badge bg-secondary">#{index + 1}</span></td>
                          <td>{new Date(record.effectiveFrom || record.createdAt).toLocaleString()}</td>
                          <td>{record.baseRiskRate}%</td>
                          <td>₹{record.processingFee}</td>
                          <td>
                            <div className="text-truncate" style={{ maxWidth: '200px' }} title={record.remarks}>
                              {record.remarks || 'No remarks provided'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info border-0 d-flex align-items-center">
                  <i className="bi bi-info-circle fs-4 me-3"></i>
                  <div>
                    <strong>No History Found</strong>
                    <p className="mb-0 small">This rule has no audit trail records available.</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer border-top-0 bg-light">
              <button type="button" className="btn btn-secondary px-4" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PricingRuleHistoryModal;
