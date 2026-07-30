import React, { useState, useEffect } from 'react';
import { createPricingRule, activatePricingRule, getActivePricingRuleForPlan } from '../../services/pricingRuleService';
import { generateQuote } from '../../services/quoteService';
import { notify } from '../../utils/notificationService';
import PricingRuleHistoryModal from './PricingRuleHistoryModal';
import PremiumBreakdownCard from '../customer/PremiumBreakdownCard';
import ErrorAlert from '../ui/ErrorAlert';

const PricingRuleManager = ({ productId, planId, onUpdate }) => {
  const [activeRule, setActiveRule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Form Data for Creation
  const [ruleData, setRuleData] = useState({
    baseRiskRate: 0.025,
    processingFee: 100,
    gst: 18,
    remarks: ''
  });

  // Preview Data
  const [previewVars, setPreviewVars] = useState({
    coverageAmount: 500000,
    duration: 1,
    premiumType: 'ANNUAL'
  });
  const [previewResult, setPreviewResult] = useState(null);
  const [previewRuleId, setPreviewRuleId] = useState(null);

  const fetchActiveRule = async () => {
    setLoading(true);
    try {
      const res = await getActivePricingRuleForPlan(planId);
      setActiveRule(res.data || res || null);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Failed to fetch active pricing rule", error);
      }
      setActiveRule(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (planId) {
      fetchActiveRule();
    }
  }, [planId]);

  const handleCreateRule = async (e) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);
    try {
      const payload = {
        planId: Number(planId),
        effectiveFrom: new Date().toISOString(),
        ...ruleData
      };
      const res = await createPricingRule(payload);
      const newRuleId = res.data?.id || res.id;
      notify.success("Draft Pricing Rule saved. Please test it in Preview before activating.");
      setPreviewRuleId(newRuleId);
      setShowCreateForm(false);
      setShowPreview(true);
    } catch (error) {
      const msg = error.message || "Failed to create pricing rule.";
      setError(msg);
      notify.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreview = async (e) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);
    try {
      const payload = {
        planId: Number(planId),
        ...previewVars
      };
      const res = await generateQuote(payload);
      setPreviewResult(res.data || res);
      notify.success("Simulation complete.");
    } catch (error) {
      const msg = error.message || "Simulation failed.";
      setError(msg);
      notify.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActivatePreviewRule = async () => {
    setError('');
    setIsProcessing(true);
    try {
      await activatePricingRule(previewRuleId);
      notify.success("Pricing Rule activated successfully!");
      setShowPreview(false);
      setPreviewRuleId(null);
      fetchActiveRule();
      if (onUpdate) onUpdate();
    } catch (error) {
      const msg = error.message || "Failed to activate pricing rule.";
      setError(msg);
      notify.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const openPreviewForActive = () => {
    setPreviewRuleId(activeRule?.id || activeRule?.pricingRuleId);
    setShowPreview(true);
  };

  if (loading) return <div className="text-center p-3"><span className="spinner-border spinner-border-sm text-primary"></span></div>;

  return (
    <div className="card border-0 mb-4" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold m-0">Pricing Rule Configuration</h6>
          {!showCreateForm && (
            <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => setShowCreateForm(true)}>
              + Create New Rule
            </button>
          )}
        </div>

        {error && (
          <div className="mb-3">
            <ErrorAlert message={error} onClose={() => setError('')} />
          </div>
        )}

        {/* Current Active Rule Display */}
        {!showCreateForm && !showPreview && activeRule && (
          <div className="bg-light border border-success border-opacity-25 rounded-3 p-4 mb-3 position-relative overflow-hidden">
            <div className="position-absolute top-0 end-0 bg-success text-white px-3 py-1 fw-bold small" style={{ borderBottomLeftRadius: '8px' }}>
              ACTIVE
            </div>
            <div className="row g-3">
              <div className="col-6 col-md-4">
                <span className="d-block small text-muted">Base Rate</span>
                <span className="fw-bold fs-5">{activeRule.baseRiskRate}%</span>
              </div>
              <div className="col-6 col-md-4">
                <span className="d-block small text-muted">Processing Fee</span>
                <span className="fw-bold fs-5">₹{activeRule.processingFee}</span>
              </div>
              <div className="col-6 col-md-4">
                <span className="d-block small text-muted">GST</span>
                <span className="fw-bold fs-5">{activeRule.gst}%</span>
              </div>
            </div>
            
            <hr className="my-3 opacity-25" />
            
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="small text-muted d-block mb-1">Remarks</span>
                <span className="small fst-italic">{activeRule.remarks || 'No remarks provided'}</span>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setIsHistoryModalOpen(true)}>
                  <i className="bi bi-clock-history me-1"></i> History
                </button>
                <button className="btn btn-sm btn-outline-primary" onClick={openPreviewForActive}>
                  <i className="bi bi-calculator me-1"></i> Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {!showCreateForm && !showPreview && !activeRule && (
          <div className="text-center p-4 bg-light rounded-3 text-muted mb-3">
            <i className="bi bi-calculator fs-2 d-block mb-2"></i>
            No active pricing rule found for this plan.
          </div>
        )}

        {/* Create Rule Form */}
        {showCreateForm && (
          <div className="bg-light rounded-3 p-4 mb-3 fade-in">
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <h6 className="fw-semibold m-0">Draft New Pricing Rule</h6>
              <button className="btn-close" onClick={() => setShowCreateForm(false)}></button>
            </div>
            <form onSubmit={handleCreateRule}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label small text-muted mb-1">Base Risk Rate (%)</label>
                  <input type="number" step="0.001" className="form-control form-control-sm" value={ruleData.baseRiskRate} onChange={(e) => setRuleData({...ruleData, baseRiskRate: Number(e.target.value)})} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small text-muted mb-1">Processing Fee (₹)</label>
                  <input type="number" step="1" className="form-control form-control-sm" value={ruleData.processingFee} onChange={(e) => setRuleData({...ruleData, processingFee: Number(e.target.value)})} onKeyDown={(e) => { if (e.key === '.' || e.key === 'e') e.preventDefault(); }} />
                </div>
                <div className="col-md-4">
                  <label className="form-label small text-muted mb-1">GST (%)</label>
                  <input type="number" step="1" className="form-control form-control-sm" value={ruleData.gst} onChange={(e) => setRuleData({...ruleData, gst: Number(e.target.value)})} onKeyDown={(e) => { if (e.key === '.' || e.key === 'e') e.preventDefault(); }} />
                </div>

                <div className="col-md-12">
                  <label className="form-label small text-muted mb-1">Remarks (Optional)</label>
                  <input type="text" className="form-control form-control-sm" value={ruleData.remarks} onChange={(e) => setRuleData({...ruleData, remarks: e.target.value})} placeholder="e.g. End of year discount push" />
                </div>
                
                <div className="col-md-12 mt-3 text-end">
                  <button type="submit" className="btn btn-primary btn-sm px-4" disabled={isProcessing}>
                    {isProcessing ? "Saving..." : "Save Draft Rule"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Simulation / Preview Tool */}
        {showPreview && (
          <div className="bg-white border rounded-3 p-4 mb-3 shadow-sm fade-in">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold m-0"><i className="bi bi-magic me-2 text-primary"></i>Premium Simulator</h6>
              <button className="btn-close" onClick={() => setShowPreview(false)}></button>
            </div>
            
            <div className="row">
              <div className="col-md-6 border-end pe-4">
                <form onSubmit={handlePreview}>
                  <div className="mb-3">
                    <label className="form-label small text-muted mb-1">Test Coverage Amount</label>
                    <input type="number" step="1" className="form-control form-control-sm" value={previewVars.coverageAmount} onChange={(e) => setPreviewVars({...previewVars, coverageAmount: Number(e.target.value)})} onKeyDown={(e) => { if (e.key === '.' || e.key === 'e') e.preventDefault(); }} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted mb-1">Test Duration (Years)</label>
                    <input type="number" step="1" className="form-control form-control-sm" value={previewVars.duration} onChange={(e) => setPreviewVars({...previewVars, duration: Number(e.target.value)})} onKeyDown={(e) => { if (e.key === '.' || e.key === 'e') e.preventDefault(); }} />
                  </div>
                  <div className="mb-4">
                    <label className="form-label small text-muted mb-1">Test Premium Type</label>
                    <select className="form-select form-select-sm" value={previewVars.premiumType} onChange={(e) => setPreviewVars({...previewVars, premiumType: e.target.value})}>
                      <option value="ANNUAL">ANNUAL</option>
                      <option value="ONE_TIME">ONE_TIME</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-outline-primary btn-sm w-100" disabled={isProcessing}>
                    {isProcessing ? "Calculating..." : "Run Simulation"}
                  </button>
                </form>
              </div>
              
              <div className="col-md-6 ps-4">
                <h6 className="fs-6 mb-3 text-muted">Output Breakdown</h6>
                {previewResult ? (
                  <>
                    <PremiumBreakdownCard quoteDetails={previewResult} />
                    {previewRuleId && previewRuleId !== (activeRule?.id || activeRule?.pricingRuleId) && (
                      <div className="mt-4 pt-3 border-top">
                        <div className="alert alert-warning small py-2 mb-3">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          Rule is currently a DRAFT.
                        </div>
                        <button onClick={handleActivatePreviewRule} className="btn btn-success btn-sm w-100" disabled={isProcessing}>
                          {isProcessing ? "Activating..." : "Approve & Activate Rule"}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-muted small text-center p-4 bg-light rounded h-100 d-flex flex-column justify-content-center">
                    <i className="bi bi-arrow-left-circle fs-3 mb-2 opacity-50"></i>
                    Input variables and run simulation to verify the math.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <PricingRuleHistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
        ruleId={activeRule?.id || activeRule?.pricingRuleId} 
      />
    </div>
  );
};

export default PricingRuleManager;
