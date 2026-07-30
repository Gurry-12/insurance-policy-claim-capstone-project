import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts } from '../../../services/productService';
import { createPlan } from '../../../services/planService';
import { notify } from '../../../utils/notificationService';
import PageHeader from '../../../components/common/PageHeader';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorAlert from '../../../components/ui/ErrorAlert';
import { PREMIUM_TYPE_OPTIONS } from '../../../utils/options';

const DURATION_OPTIONS = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30];

const COVERAGE_STEP_OPTIONS = [
  { value: 50000, label: '₹50,000 (50k)' },
  { value: 100000, label: '₹1,00,000 (1 Lakh)' },
  { value: 200000, label: '₹2,00,000 (2 Lakhs)' },
  { value: 250000, label: '₹2,50,000 (2.5 Lakhs)' },
  { value: 500000, label: '₹5,00,000 (5 Lakhs)' },
  { value: 1000000, label: '₹10,00,000 (10 Lakhs)' },
  { value: 2500000, label: '₹25,00,000 (25 Lakhs)' },
  { value: 5000000, label: '₹50,00,000 (50 Lakhs)' },
  { value: 10000000, label: '₹1,00,00,000 (1 Crore)' },
];

const COVERAGE_SLAB_OPTIONS = [
  { value: 50000, label: '₹50,000 (50k)' },
  { value: 100000, label: '₹1,00,000 (1 Lakh)' },
  { value: 200000, label: '₹2,00,000 (2 Lakhs)' },
  { value: 300000, label: '₹3,00,000 (3 Lakhs)' },
  { value: 500000, label: '₹5,00,000 (5 Lakhs)' },
  { value: 1000000, label: '₹10,00,000 (10 Lakhs)' },
  { value: 1500000, label: '₹15,00,000 (15 Lakhs)' },
  { value: 2000000, label: '₹20,00,000 (20 Lakhs)' },
  { value: 2500000, label: '₹25,00,000 (25 Lakhs)' },
  { value: 5000000, label: '₹50,00,000 (50 Lakhs)' },
  { value: 10000000, label: '₹1,00,00,000 (1 Crore)' },
  { value: 20000000, label: '₹2,00,00,000 (2 Crores)' },
  { value: 50000000, label: '₹5,00,00,000 (5 Crores)' },
];

const sectionCard = {
  borderRadius: 'var(--ip-radius-lg)',
  boxShadow: 'var(--ip-shadow-md)',
};

const sectionHeader = {
  fontSize: '0.8rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--ip-text-muted)',
  marginBottom: '1rem',
};

const inputStyle = {
  borderRadius: 'var(--ip-radius-sm)',
  border: '1.5px solid var(--ip-border)',
  padding: '0.6rem 0.85rem',
  fontSize: '0.88rem',
  backgroundColor: 'var(--ip-surface)',
  color: 'var(--ip-text-primary)',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const labelStyle = {
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'var(--ip-text-muted)',
  marginBottom: '0.35rem',
};

const CreatePlanPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState({
    planName: '',
    productId: '',
    premiumType: 'ANNUAL',
    durations: [1, 2, 3, 5],
    minCoverage: 100000,
    maxCoverage: 1000000,
    coverageStep: 100000,
    baseRiskRate: 0.025,
    processingFee: 100,
    gst: 18,
    termsAndConditions: '',
  });

  useEffect(() => {
    getAllProducts()
      .then((res) => {
        const list = res?.data || res || [];
        setProducts(Array.isArray(list) ? list : []);
      })
      .catch(() => notify.error('Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!form.productId || products.length === 0) return;
    const product = products.find((p) => (p.productId || p.id) == form.productId);
    if (!product) return;

    const defaults = {
      baseRiskRate: 0.02,
      processingFee: 100,
      gst: 18,
    };

    switch (product.productType) {
      case 'HEALTH':
        defaults.baseRiskRate = 0.025;
        defaults.processingFee = 100;
        defaults.gst = 0;
        break;
      case 'LIFE':
        defaults.baseRiskRate = 0.008;
        defaults.processingFee = 200;
        defaults.gst = 0;
        break;
      case 'MOTOR':
        defaults.baseRiskRate = 0.03;
        defaults.processingFee = 150;
        defaults.gst = 18;
        break;
      case 'TRAVEL':
        defaults.baseRiskRate = 0.015;
        defaults.processingFee = 50;
        defaults.gst = 18;
        break;
    }

    setForm((f) => ({
      ...f,
      baseRiskRate: defaults.baseRiskRate,
      processingFee: defaults.processingFee,
      gst: defaults.gst,
    }));
  }, [form.productId, products]);

  const coveragePreview = useMemo(() => {
    const min = Number(form.minCoverage);
    const max = Number(form.maxCoverage);
    const step = Number(form.coverageStep);
    if (!min || !max || !step || min >= max || step <= 0) return [];
    const tiers = [];
    for (let amt = min; amt <= max; amt += step) tiers.push(amt);
    return tiers;
  }, [form.minCoverage, form.maxCoverage, form.coverageStep]);

  const premiumPreview = useMemo(() => {
    const rate = Number(form.baseRiskRate) || 0;
    const fee = Number(form.processingFee) || 0;
    const gstPct = Number(form.gst) || 0;
    const sample = 500000;
    const base = sample * rate;
    const beforeGst = base + fee;
    const gst = beforeGst * (gstPct / 100);
    return { base, fee, gst, total: beforeGst + gst };
  }, [form.baseRiskRate, form.processingFee, form.gst]);

  const toggleDuration = (yr) => {
    setForm((f) => ({
      ...f,
      durations: f.durations.includes(yr)
        ? f.durations.filter((d) => d !== yr)
        : [...f.durations, yr].sort((a, b) => a - b),
    }));
  };

  const isFormValid = React.useMemo(() => {
    if (!form.planName || form.planName.trim().length < 2) return false;
    if (!form.productId) return false;
    if (!form.premiumType) return false;
    if (!form.durations || form.durations.length === 0) return false;
    if (Number(form.minCoverage) < 50000 || Number(form.minCoverage) % 50000 !== 0) return false;
    if (Number(form.maxCoverage) <= Number(form.minCoverage) || Number(form.maxCoverage) > 50000000) return false;
    if (coveragePreview.length === 0 || coveragePreview.length > 30) return false;
    if (form.baseRiskRate === '' || Number(form.baseRiskRate) < 0 || Number(form.baseRiskRate) > 1) return false;
    if (form.processingFee === '' || Number(form.processingFee) < 0) return false;
    if (form.gst === '' || Number(form.gst) < 0) return false;
    if (!form.termsAndConditions || !form.termsAndConditions.trim()) return false;
    return true;
  }, [form, coveragePreview]);

  const handleSubmit = async () => {
    setError('');
    if (!form.planName.trim()) {
      const msg = 'Plan name is required';
      setError(msg); return notify.error(msg);
    }
    if (!form.productId) {
      const msg = 'Select a product';
      setError(msg); return notify.error(msg);
    }
    if (form.durations.length === 0) {
      const msg = 'Select at least one duration';
      setError(msg); return notify.error(msg);
    }
    if (coveragePreview.length === 0) {
      const msg = 'Configure valid coverage range';
      setError(msg); return notify.error(msg);
    }
    const minAmt = Number(form.minCoverage);
    const maxAmt = Number(form.maxCoverage);
    const stepAmt = Number(form.coverageStep);
    if (minAmt < 50000 || minAmt % 50000 !== 0) {
      const msg = 'Minimum coverage must be at least ₹50,000 and a multiple of 50,000';
      setError(msg); return notify.error(msg);
    }
    if (stepAmt < 50000 || stepAmt % 50000 !== 0) {
      const msg = 'Coverage step must be at least ₹50,000 and a multiple of 50,000';
      setError(msg); return notify.error(msg);
    }
    if (maxAmt > 50000000 || maxAmt <= minAmt) {
      const msg = 'Maximum coverage cannot exceed ₹5,00,00,000 (5 Crores) and must be greater than minimum';
      setError(msg); return notify.error(msg);
    }
    if (coveragePreview.length > 30) {
      const msg = 'Coverage tiers must be between 1 and 30 slabs. Please adjust step amount or range.';
      setError(msg); return notify.error(msg);
    }
    if (!form.termsAndConditions.trim()) {
      const msg = 'Terms & conditions are required';
      setError(msg); return notify.error(msg);
    }

    setSubmitting(true);
    try {
      await createPlan({
        planDetails: {
          productId: Number(form.productId),
          planName: form.planName,
          supportedPremiumType: form.premiumType,
          allowedDurations: form.durations,
          termsAndConditions: form.termsAndConditions,
          activeStatus: true,
        },
        coverageOptions: coveragePreview.map((amt, i) => ({
          coverageAmount: amt,
          label: `₹${(amt / 100000).toLocaleString('en-IN')} Lakhs`,
          displayOrder: i + 1,
          activeStatus: true,
        })),
        pricingRule: {
          baseRiskRate: Number(form.baseRiskRate),
          processingFee: Number(form.processingFee),
          gst: Number(form.gst),
          effectiveFrom: new Date().toISOString(),
          remarks: `Created with plan: ${form.planName}`,
        },
      });
      notify.success('Plan created successfully!');
      navigate('/admin/plans');
    } catch (err) {
      const msg = err.message || 'Failed to create plan';
      setError(msg);
      notify.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading products..." />;

  const selectedProduct = products.find((p) => (p.productId || p.id) == form.productId);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <PageHeader
        title="Create Plan"
        subtitle="Set up a new insurance plan with coverage tiers and pricing"
        onBack={() => navigate('/admin/plans')}
      />

      {error && (
        <div className="mb-4">
          <ErrorAlert message={error} onClose={() => setError('')} />
        </div>
      )}

      <div className="row g-4">
        {/* ── Left Column: Form ── */}
        <div className="col-lg-7">
          <div className="d-flex flex-column gap-4">

            {/* Basic Info */}
            <div className="card border-0" style={sectionCard}>
              <div className="card-body p-4">
                <div style={sectionHeader}>
                  <i className="bi bi-info-circle me-2" style={{ color: 'var(--ip-brand)' }} />
                  Basic Information
                </div>
                <div className="row g-3">
                  <div className="col-md-8">
                    <label style={labelStyle}>Plan Name *</label>
                    <input
                      type="text"
                      className={`form-control ${!form.planName.trim() ? 'is-invalid' : ''}`}
                      style={inputStyle}
                      value={form.planName}
                      onChange={(e) => setForm((f) => ({ ...f, planName: e.target.value }))}
                      placeholder="e.g. Health Guard Platinum"
                    />
                    {!form.planName.trim() && (
                      <div className="text-danger small mt-1">Plan name is required (min 2 chars)</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label style={labelStyle}>Product *</label>
                    <select
                      className={`form-select ${!form.productId ? 'is-invalid' : ''}`}
                      style={inputStyle}
                      value={form.productId}
                      onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                    >
                      <option value="">Select product...</option>
                      {products.map((p) => (
                        <option key={p.productId || p.id} value={p.productId || p.id}>
                          {p.productName}
                        </option>
                      ))}
                    </select>
                    {!form.productId && (
                      <div className="text-danger small mt-1">Please select an insurance product</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Type */}
            <div className="card border-0" style={sectionCard}>
              <div className="card-body p-4">
                <div style={sectionHeader}>
                  <i className="bi bi-credit-card me-2" style={{ color: 'var(--ip-brand)' }} />
                  Premium Type
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {PREMIUM_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className="btn"
                      style={{
                        borderRadius: 'var(--ip-radius-pill)',
                        padding: '0.5rem 1.25rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        border: form.premiumType === opt.value ? 'none' : '1.5px solid var(--ip-border)',
                        backgroundColor: form.premiumType === opt.value ? 'var(--ip-brand)' : 'transparent',
                        color: form.premiumType === opt.value ? '#fff' : 'var(--ip-text-secondary)',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => setForm((f) => ({ ...f, premiumType: opt.value }))}
                    >
                      {form.premiumType === opt.value && <i className="bi bi-check2 me-1" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Durations */}
            <div className="card border-0" style={sectionCard}>
              <div className="card-body p-4">
                <div style={sectionHeader}>
                  <i className="bi bi-clock-history me-2" style={{ color: 'var(--ip-brand)' }} />
                  Allowed Durations *
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((yr) => {
                    const selected = form.durations.includes(yr);
                    return (
                      <button
                        key={yr}
                        type="button"
                        className="btn"
                        style={{
                          borderRadius: 'var(--ip-radius-pill)',
                          padding: '0.45rem 1rem',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          minWidth: '72px',
                          border: selected ? 'none' : '1.5px solid var(--ip-border)',
                          backgroundColor: selected ? 'var(--ip-success)' : 'transparent',
                          color: selected ? '#fff' : 'var(--ip-text-secondary)',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => toggleDuration(yr)}
                      >
                        {yr} {yr === 1 ? 'Yr' : 'Yrs'}
                      </button>
                    );
                  })}
                </div>
                {form.durations.length === 0 && (
                  <div className="text-danger small mt-2">
                    <i className="bi bi-exclamation-circle me-1" />
                    Select at least one duration
                  </div>
                )}
              </div>
            </div>

            {/* Coverage Tiers */}
            <div className="card border-0" style={sectionCard}>
              <div className="card-body p-4">
                <div style={sectionHeader}>
                  <i className="bi bi-shield-check me-2" style={{ color: 'var(--ip-brand)' }} />
                  Coverage Tiers *
                </div>
                <div className="row g-3 mb-2">
                  <div className="col-md-4">
                    <label style={labelStyle}>Min (₹) *</label>
                    <select
                      className="form-select"
                      style={inputStyle}
                      value={form.minCoverage}
                      onChange={(e) => setForm((f) => ({ ...f, minCoverage: Number(e.target.value) }))}
                    >
                      {COVERAGE_SLAB_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label style={labelStyle}>Max (₹) *</label>
                    <select
                      className={`form-select ${Number(form.maxCoverage) <= Number(form.minCoverage) ? 'is-invalid' : ''}`}
                      style={inputStyle}
                      value={form.maxCoverage}
                      onChange={(e) => setForm((f) => ({ ...f, maxCoverage: Number(e.target.value) }))}
                    >
                      {COVERAGE_SLAB_OPTIONS.map((s) => (
                        <option
                          key={s.value}
                          value={s.value}
                          disabled={s.value <= Number(form.minCoverage)}
                        >
                          {s.label}
                        </option>
                      ))}
                    </select>
                    {Number(form.maxCoverage) <= Number(form.minCoverage) && (
                      <div className="text-danger small mt-1">Max must be greater than Min</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label style={labelStyle}>Step (₹) *</label>
                    <select
                      className="form-select"
                      style={inputStyle}
                      value={form.coverageStep}
                      onChange={(e) => setForm((f) => ({ ...f, coverageStep: Number(e.target.value) }))}
                    >
                      {COVERAGE_STEP_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {coveragePreview.length > 30 && (
                  <div className="text-danger small mb-2 fw-semibold">
                    <i className="bi bi-exclamation-triangle-fill me-1" />
                    Too many slabs ({coveragePreview.length}). Maximum 30 slabs allowed. Increase Step amount.
                  </div>
                )}
                {coveragePreview.length > 0 && (
                  <div
                    className="p-3"
                    style={{
                      borderRadius: 'var(--ip-radius-md)',
                      backgroundColor: 'var(--ip-success-bg)',
                      border: '1px solid var(--ip-success-subtle)',
                    }}
                  >
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span
                        className="badge"
                        style={{
                          backgroundColor: 'var(--ip-success)',
                          color: '#fff',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 'var(--ip-radius-pill)',
                        }}
                      >
                        {coveragePreview.length} tiers
                      </span>
                      <small className="text-muted">
                        ₹{Math.min(...coveragePreview).toLocaleString('en-IN')} — ₹{Math.max(...coveragePreview).toLocaleString('en-IN')}
                      </small>
                    </div>
                    <div className="d-flex flex-wrap gap-1.5">
                      {coveragePreview.map((amt, i) => (
                        <span
                          key={i}
                          className="badge"
                          style={{
                            backgroundColor: 'var(--ip-success-subtle)',
                            color: 'var(--ip-success)',
                            fontWeight: 600,
                            fontSize: '0.78rem',
                            padding: '5px 10px',
                            borderRadius: 'var(--ip-radius-sm)',
                          }}
                        >
                          ₹{(amt / 100000).toLocaleString('en-IN')}L
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {coveragePreview.length === 0 && (
                  <div className="text-center py-3 text-muted small">
                    <i className="bi bi-info-circle me-1" />
                    Configure min, max, and step to generate tiers
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="card border-0" style={sectionCard}>
              <div className="card-body p-4">
                <div style={sectionHeader}>
                  <i className="bi bi-calculator me-2" style={{ color: 'var(--ip-brand)' }} />
                  Pricing
                </div>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label style={labelStyle}>Base Risk Rate (0–1)</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max="1"
                      className="form-control"
                      style={inputStyle}
                      value={form.baseRiskRate}
                      onChange={(e) => setForm((f) => ({ ...f, baseRiskRate: e.target.value }))}
                    />
                    <div className="form-text mt-1">
                      <span
                        className="badge"
                        style={{
                          backgroundColor: 'var(--ip-brand-light)',
                          color: 'var(--ip-brand)',
                          fontWeight: 600,
                          fontSize: '0.72rem',
                          padding: '3px 8px',
                        }}
                      >
                        {(form.baseRiskRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label style={labelStyle}>Processing Fee (₹)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      className="form-control"
                      style={inputStyle}
                      value={form.processingFee}
                      onChange={(e) => setForm((f) => ({ ...f, processingFee: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === '.' || e.key === 'e') e.preventDefault(); }}
                    />
                  </div>
                  <div className="col-md-4">
                    <label style={labelStyle}>GST (%)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      className="form-control"
                      style={inputStyle}
                      value={form.gst}
                      onChange={(e) => setForm((f) => ({ ...f, gst: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === '.' || e.key === 'e') e.preventDefault(); }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="card border-0" style={sectionCard}>
              <div className="card-body p-4">
                <div style={sectionHeader}>
                  <i className="bi bi-file-text me-2" style={{ color: 'var(--ip-brand)' }} />
                  Terms & Conditions *
                </div>
                <textarea
                  className={`form-control ${!form.termsAndConditions.trim() ? 'is-invalid' : ''}`}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  rows={4}
                  value={form.termsAndConditions}
                  onChange={(e) => setForm((f) => ({ ...f, termsAndConditions: e.target.value }))}
                  placeholder="Describe coverage terms, rules, and conditions..."
                />
                {!form.termsAndConditions.trim() && (
                  <div className="text-danger small mt-1">
                    <i className="bi bi-exclamation-circle me-1" />
                    Terms & conditions are required
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            {!isFormValid && (
              <div className="alert alert-danger py-2 px-3 small mb-2 d-flex align-items-center gap-2" style={{ borderRadius: 'var(--ip-radius-md)' }}>
                <i className="bi bi-exclamation-triangle-fill fs-6 flex-shrink-0" />
                <div>
                  <strong>Form Incomplete:</strong> Please fill all required fields correctly to enable the Create Plan button.
                </div>
              </div>
            )}
            <div className="d-flex justify-content-end gap-3 pb-2">
              <button
                className="btn px-4"
                style={{
                  borderRadius: 'var(--ip-radius-pill)',
                  fontWeight: 600,
                  border: '1.5px solid var(--ip-border)',
                  color: 'var(--ip-text-secondary)',
                }}
                onClick={() => navigate('/admin/plans')}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="btn px-5"
                style={{
                  borderRadius: 'var(--ip-radius-pill)',
                  fontWeight: 700,
                  backgroundColor: !isFormValid ? 'var(--ip-border)' : 'var(--ip-success)',
                  color: '#fff',
                  boxShadow: 'var(--ip-shadow-sm)',
                  cursor: !isFormValid ? 'not-allowed' : 'pointer',
                  opacity: !isFormValid ? 0.65 : 1,
                }}
                onClick={handleSubmit}
                disabled={submitting || !isFormValid}
              >
                {submitting ? (
                  <><span className="spinner-border spinner-border-sm me-2" /> Creating...</>
                ) : (
                  <><i className="bi bi-check-lg me-2" /> Create Plan</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Column: Live Preview ── */}
        <div className="col-lg-5">
          <div
            className="card border-0 sticky-top"
            style={{ ...sectionCard, top: '80px' }}
          >
            <div className="card-body p-4">
              {/* Preview Header */}
              <div className="d-flex align-items-center gap-2 mb-4">
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--ip-radius-sm)',
                    backgroundColor: 'var(--ip-brand-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ip-brand)',
                  }}
                >
                  <i className="bi bi-eye-fill" />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ip-text-primary)' }}>
                    Live Preview
                  </div>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Updates as you type
                  </small>
                </div>
              </div>

              {/* Plan Identity */}
              <div
                className="p-3 mb-4"
                style={{
                  borderRadius: 'var(--ip-radius-md)',
                  background: 'linear-gradient(135deg, var(--ip-brand) 0%, #764ba2 100%)',
                  color: '#fff',
                }}
              >
                <div className="fw-bold" style={{ fontSize: '1.05rem' }}>
                  {form.planName || 'Plan Name'}
                </div>
                <small className="opacity-75">
                  {selectedProduct?.productName || 'Select a product'}
                </small>
                <div className="mt-2 d-flex gap-2 flex-wrap">
                  <span
                    className="badge"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                    }}
                  >
                    {PREMIUM_TYPE_OPTIONS.find((o) => o.value === form.premiumType)?.label || form.premiumType}
                  </span>
                  {form.durations.length > 0 && (
                    <span
                      className="badge"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.72rem',
                      }}
                    >
                      {form.durations.length} duration{form.durations.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {coveragePreview.length > 0 && (
                    <span
                      className="badge"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.72rem',
                      }}
                    >
                      {coveragePreview.length} tiers
                    </span>
                  )}
                </div>
              </div>

              {/* Durations */}
              {form.durations.length > 0 && (
                <div className="mb-3">
                  <small className="text-muted d-block fw-bold mb-2" style={{ fontSize: '0.72rem' }}>
                    DURATIONS
                  </small>
                  <div className="d-flex flex-wrap gap-1.5">
                    {form.durations.map((d) => (
                      <span
                        key={d}
                        className="badge"
                        style={{
                          backgroundColor: 'var(--ip-surface-raised)',
                          color: 'var(--ip-text-secondary)',
                          fontWeight: 600,
                          fontSize: '0.78rem',
                          padding: '4px 10px',
                        }}
                      >
                        {d} {d === 1 ? 'Year' : 'Years'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Coverage Range */}
              {coveragePreview.length > 0 && (
                <div className="mb-3">
                  <small className="text-muted d-block fw-bold mb-2" style={{ fontSize: '0.72rem' }}>
                    COVERAGE RANGE
                  </small>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-semibold" style={{ color: 'var(--ip-text-primary)', fontSize: '0.92rem' }}>
                      ₹{Math.min(...coveragePreview).toLocaleString('en-IN')}
                    </span>
                    <span className="text-muted">—</span>
                    <span className="fw-semibold" style={{ color: 'var(--ip-text-primary)', fontSize: '0.92rem' }}>
                      ₹{Math.max(...coveragePreview).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              <hr style={{ borderColor: 'var(--ip-border)', opacity: 0.6 }} />

              {/* Premium Preview */}
              <div className="mb-2">
                <small className="text-muted d-block fw-bold mb-3" style={{ fontSize: '0.72rem' }}>
                  PREMIUM PREVIEW · ₹5 LAKHS COVERAGE
                </small>
                <div className="row g-2">
                  <div className="col-6">
                    <div
                      className="p-2 text-center"
                      style={{
                        borderRadius: 'var(--ip-radius-sm)',
                        backgroundColor: 'var(--ip-surface-raised)',
                      }}
                    >
                      <div className="text-muted" style={{ fontSize: '0.68rem' }}>Base Premium</div>
                      <div className="fw-bold" style={{ color: 'var(--ip-brand)', fontSize: '0.95rem' }}>
                        ₹{premiumPreview.base.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div
                      className="p-2 text-center"
                      style={{
                        borderRadius: 'var(--ip-radius-sm)',
                        backgroundColor: 'var(--ip-surface-raised)',
                      }}
                    >
                      <div className="text-muted" style={{ fontSize: '0.68rem' }}>Processing Fee</div>
                      <div className="fw-bold" style={{ color: 'var(--ip-brand)', fontSize: '0.95rem' }}>
                        ₹{premiumPreview.fee.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div
                      className="p-2 text-center"
                      style={{
                        borderRadius: 'var(--ip-radius-sm)',
                        backgroundColor: 'var(--ip-surface-raised)',
                      }}
                    >
                      <div className="text-muted" style={{ fontSize: '0.68rem' }}>GST ({form.gst}%)</div>
                      <div className="fw-bold" style={{ color: 'var(--ip-brand)', fontSize: '0.95rem' }}>
                        ₹{premiumPreview.gst.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div
                      className="p-2 text-center"
                      style={{
                        borderRadius: 'var(--ip-radius-sm)',
                        backgroundColor: 'var(--ip-success-subtle)',
                      }}
                    >
                      <div className="text-muted" style={{ fontSize: '0.68rem' }}>Total</div>
                      <div className="fw-bold" style={{ color: 'var(--ip-success)', fontSize: '1.1rem' }}>
                        ₹{premiumPreview.total.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePlanPage;
