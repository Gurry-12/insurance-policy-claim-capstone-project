import React, { useState, useEffect, useCallback } from 'react';
import {
  getActivePricingRuleForPlan,
  getAllPricingRulesForPlan,
  createPricingRule,
  activatePricingRule,
  deactivatePricingRule,
  deletePricingRule,
} from '../../services/pricingRuleService';
import toast from 'react-hot-toast';

const defaultForm = {
  baseRiskRate: 0.025,
  processingFee: 150,
  gst: 18,
  effectiveFrom: new Date().toISOString().slice(0, 16),
  remarks: '',
};

const PricingRulePanel = ({ planId }) => {
  const [activeRule, setActiveRule]   = useState(null);
  const [history, setHistory]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState(defaultForm);
  const [submitting, setSubmitting]     = useState(false);
  const [activating, setActivating]     = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch active rule
      const activeRes = await getActivePricingRuleForPlan(planId);
      setActiveRule(activeRes?.data || activeRes || null);
    } catch {
      setActiveRule(null); // 404 = no active rule
    }
    try {
      // Fetch full history
      const histRes = await getAllPricingRulesForPlan(planId);
      const list = histRes?.data || histRes || [];
      setHistory(Array.isArray(list) ? list : []);
    } catch {
      setHistory([]);
    }
    setLoading(false);
  }, [planId]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const isRuleFormValid = React.useMemo(() => {
    const rate = Number(form.baseRiskRate);
    const fee = Number(form.processingFee);
    const gstVal = Number(form.gst);
    if (!form.baseRiskRate || isNaN(rate) || rate <= 0 || rate > 1) return false;
    if (form.processingFee === '' || isNaN(fee) || fee < 0) return false;
    if (form.gst === '' || isNaN(gstVal) || gstVal < 0 || gstVal > 100) return false;
    if (!form.effectiveFrom) return false;
    if (!form.remarks || !form.remarks.trim()) return false;
    return true;
  }, [form]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const errs = {};

    const rate = Number(form.baseRiskRate);
    const fee  = Number(form.processingFee);
    const gst  = Number(form.gst);

    if (!form.baseRiskRate || isNaN(rate) || rate <= 0 || rate > 1)
      errs.baseRiskRate = 'Base risk rate must be between 0.001 and 1 (i.e. 0.1% – 100%).';
    if (form.processingFee === '' || isNaN(fee) || fee < 0)
      errs.processingFee = 'Processing fee must be 0 or greater.';
    if (!form.gst || isNaN(gst) || gst < 0 || gst > 100)
      errs.gst = 'GST must be between 0 and 100.';
    if (!form.effectiveFrom)
      errs.effectiveFrom = 'Effective From date is required.';
    if (!form.remarks.trim())
      errs.remarks = 'Remarks are required.';

    if (Object.keys(errs).length > 0) {
      // Show first error as toast and set inline errors
      toast.error(Object.values(errs)[0]);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        planId: Number(planId),
        baseRiskRate: Number(form.baseRiskRate),
        processingFee: Number(form.processingFee),
        gst: Number(form.gst),
        effectiveFrom: new Date(form.effectiveFrom).toISOString(),
        remarks: form.remarks,
      };
      await createPricingRule(payload);
      toast.success('Pricing rule created!');
      setShowForm(false);
      setForm(defaultForm);
      await fetchRules();
    } catch (err) {
      toast.error(err?.message || 'Failed to create pricing rule.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (ruleId) => {
    if (activeRule && activeRule.id !== ruleId) {
      toast.error('An active pricing rule already exists for this plan. Please deactivate it first before activating a new one.');
      return;
    }
    setActivating(true);
    try {
      await activatePricingRule(ruleId);
      toast.success('Pricing rule activated!');
      await fetchRules();
    } catch (err) {
      toast.error(err?.message || 'Failed to activate rule.');
    } finally {
      setActivating(false);
    }
  };

  const handleDeactivate = async (ruleId) => {
    setDeactivating(true);
    try {
      await deactivatePricingRule(ruleId);
      toast.success('Pricing rule deactivated.');
      await fetchRules();
    } catch (err) {
      toast.error(err?.message || 'Failed to deactivate rule.');
    } finally {
      setDeactivating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deletePricingRule(deleteConfirm);
      toast.success('Pricing rule deleted.');
      setDeleteConfirm(null);
      await fetchRules();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete rule.');
    } finally {
      setDeleting(false);
    }
  };

  /* ── helpers ── */
  const statusBadge = (status) => {
    const map = {
      ACTIVE:   { bg: 'var(--ip-success-bg, #d1fae5)', color: 'var(--ip-success, #065f46)', label: 'Active' },
      INACTIVE: { bg: 'var(--ip-danger-bg, #fee2e2)', color: 'var(--ip-danger, #991b1b)', label: 'Inactive' },
      EXPIRED:  { bg: 'var(--ip-warning-bg, #fef3c7)', color: 'var(--ip-warning, #92400e)', label: 'Expired' },
    };
    const s = map[status] || { bg: 'var(--ip-surface-raised, #f3f4f6)', color: 'var(--ip-text-muted, #6b7280)', label: status };
    return (
      <span style={{
        backgroundColor: s.bg, color: s.color,
        padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600
      }}>{s.label}</span>
    );
  };

  return (
    <>
    <div className="card border-0 mb-4" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
      <div className="card-body p-4">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h6 className="fw-bold mb-1">
              <i className="bi bi-calculator me-2 text-primary" />
              Pricing Rule
            </h6>
            <small className="text-muted">Controls how premium is calculated for this plan.</small>
          </div>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => setShowForm(f => !f)}
          >
            <i className={`bi ${showForm ? 'bi-x-lg' : 'bi-plus-lg'} me-1`} />
            {showForm ? 'Cancel' : 'New Rule'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-3">
            <span className="spinner-border spinner-border-sm text-primary" />
            <span className="ms-2 text-muted small">Loading pricing rules…</span>
          </div>
        ) : (
          <>
            {/* Active Rule Banner */}
            {activeRule ? (
              <div className="p-3 rounded-3 mb-3"
                style={{ backgroundColor: 'var(--ip-success-bg, #f0fdf4)', border: '1px solid var(--ip-success-subtle, #bbf7d0)' }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="fw-semibold text-success">
                    <i className="bi bi-check-circle-fill me-2" />Active Rule (Rule #{(() => {
                      const idx = history.findIndex(r => r.id === activeRule.id);
                      return idx !== -1 ? idx + 1 : activeRule.id;
                    })()})
                  </span>
                  <div className="d-flex align-items-center gap-2">
                    {statusBadge('ACTIVE')}
                    <button
                      className="btn btn-xs btn-outline-warning py-0 px-2"
                      style={{ fontSize: '0.75rem' }}
                      disabled={deactivating}
                      onClick={() => handleDeactivate(activeRule.id)}
                      title="Deactivate this rule so it can be deleted"
                    >
                      {deactivating
                        ? <span className="spinner-border spinner-border-sm" />
                        : <><i className="bi bi-pause-circle me-1" />Deactivate</>}
                    </button>
                  </div>
                </div>
                <div className="row g-2 small text-muted mt-1">
                  <div className="col-4">
                    <span className="d-block fw-semibold text-dark">Base Risk Rate</span>
                    {(Number(activeRule.baseRiskRate) * 100).toFixed(2)}%
                  </div>
                  <div className="col-4">
                    <span className="d-block fw-semibold text-dark">Processing Fee</span>
                    ₹{Number(activeRule.processingFee).toLocaleString('en-IN')}
                  </div>
                  <div className="col-4">
                    <span className="d-block fw-semibold text-dark">GST</span>
                    {activeRule.gst}%
                  </div>
                </div>
                {activeRule.remarks && (
                  <div className="mt-2 small text-muted fst-italic">
                    <i className="bi bi-chat-left-quote me-1" />{activeRule.remarks}
                  </div>
                )}
              </div>
            ) : (
              /* Warning Banner — no active rule */
              <div className="alert alert-warning d-flex align-items-start gap-3 py-3 mb-3">
                <i className="bi bi-exclamation-triangle-fill fs-5 flex-shrink-0 mt-1" />
                <div>
                  <strong>No active pricing rule!</strong>
                  <div className="small mt-1">
                    Customers cannot generate quotes for this plan until an active pricing rule is configured.
                    Click <strong>New Rule</strong> to create and activate one.
                  </div>
                </div>
              </div>
            )}

            {/* Create Rule Form */}
            {showForm && (
              <form onSubmit={handleCreate}
                className="p-3 rounded-3 mb-3"
                style={{ backgroundColor: 'var(--ip-surface-raised, #f8fafc)', border: '1px dashed var(--ip-border-strong, #cbd5e1)' }}>
                <p className="fw-semibold small text-dark mb-3">
                  <i className="bi bi-pencil-square me-2 text-primary" />
                  Create New Pricing Rule
                </p>
                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <label className="form-label small text-muted mb-1">Base Risk Rate (%)</label>
                    <input type="number" step="0.001" min="0" className="form-control form-control-sm"
                      value={form.baseRiskRate}
                      onChange={e => setForm(f => ({ ...f, baseRiskRate: e.target.value }))} required />
                    <div className="form-text">e.g. 0.025 = 2.5%</div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-muted mb-1">Processing Fee (₹)</label>
                    <input type="number" step="1" min="0" className="form-control form-control-sm"
                      value={form.processingFee}
                      onChange={e => setForm(f => ({ ...f, processingFee: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === '.' || e.key === 'e') e.preventDefault(); }}
                      required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small text-muted mb-1">GST (%)</label>
                    <input type="number" step="1" min="0" max="100" className="form-control form-control-sm"
                      value={form.gst}
                      onChange={e => setForm(f => ({ ...f, gst: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === '.' || e.key === 'e') e.preventDefault(); }}
                      required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted mb-1">Effective From</label>
                    <input type="datetime-local" className="form-control form-control-sm"
                      value={form.effectiveFrom}
                      onChange={e => setForm(f => ({ ...f, effectiveFrom: e.target.value }))} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-muted mb-1">Remarks <span className="text-danger">*</span></label>
                    <input type="text" className="form-control form-control-sm"
                      placeholder="e.g. Initial rule for launch"
                      value={form.remarks}
                      onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} required />
                  </div>
                </div>
                {!isRuleFormValid && (
                  <div className="alert alert-danger py-2 px-3 small my-2 d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill fs-6 flex-shrink-0" />
                    <div>
                      <strong>Incomplete Rule:</strong> Please fill all pricing fields and remarks correctly.
                    </div>
                  </div>
                )}
                <div className="d-flex justify-content-end">
                  <button
                    type="submit"
                    className="btn btn-sm btn-success px-4"
                    style={{
                      cursor: !isRuleFormValid ? 'not-allowed' : 'pointer',
                      opacity: !isRuleFormValid ? 0.65 : 1,
                    }}
                    disabled={submitting || !isRuleFormValid}
                  >
                    {submitting
                      ? <><span className="spinner-border spinner-border-sm me-2" />Creating…</>
                      : <><i className="bi bi-plus-circle me-2" />Create Rule</>}
                  </button>
                </div>
              </form>
            )}

            {/* History Table */}
            {history.length > 0 && (
              <>
                <h6 className="fw-bold small text-muted mt-4 mb-2">Rule History</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle" style={{ fontSize: '0.82rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Rule ID</th>
                        <th>Risk Rate</th>
                        <th>Proc. Fee</th>
                        <th>GST</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((rule, i) => (
                        <tr key={rule.id || i}>
                          <td className="fw-semibold">Rule #{i + 1}</td>
                          <td>{(Number(rule.baseRiskRate) * 100).toFixed(2)}%</td>
                          <td>₹{Number(rule.processingFee).toLocaleString('en-IN')}</td>
                          <td>{rule.gst}%</td>
                          <td>{statusBadge(rule.status)}</td>
                          <td>
                            <div className="d-flex gap-1">
                              {rule.status !== 'ACTIVE' && (
                                <button
                                  className="btn btn-xs btn-outline-success py-0 px-2"
                                  style={{ fontSize: '0.75rem' }}
                                  disabled={activating || deleting}
                                  onClick={() => handleActivate(rule.id)}
                                >
                                  Activate
                                </button>
                              )}
                              {rule.status !== 'ACTIVE' && (
                                <button
                                  className="btn btn-xs btn-outline-danger py-0 px-2"
                                  style={{ fontSize: '0.75rem' }}
                                  disabled={deleting || activating}
                                  onClick={() => setDeleteConfirm(rule.id)}
                                >
                                  <i className="bi bi-trash" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
              <div className="modal-body p-4 text-center">
                <div className="mb-3" style={{
                  width: 52, height: 52, borderRadius: '50%',
                  backgroundColor: 'var(--ip-danger-bg, #fee2e2)', color: 'var(--ip-danger, #dc2626)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto', fontSize: '1.4rem'
                }}>
                  <i className="bi bi-trash" />
                </div>
                <h6 className="fw-bold mb-1">Delete Pricing Rule?</h6>
                <p className="text-muted small mb-4">
                  This action is permanent and cannot be undone.
                  Only inactive or expired rules can be deleted.
                </p>
                <div className="d-flex gap-2 justify-content-center">
                  <button
                    className="btn btn-light px-4"
                    onClick={() => setDeleteConfirm(null)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger px-4"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting
                      ? <><span className="spinner-border spinner-border-sm me-2" />Deleting…</>
                      : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default PricingRulePanel;

