import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts } from '../../../services/productService';
import { createPlan } from '../../../services/planService';
import { notify } from '../../../utils/notificationService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorAlert from '../../../components/ui/ErrorAlert';
import FormGuidelines from '../../../components/ui/FormGuidelines';
import SearchSelect from '../../../components/forms/SearchSelect';
import { PREMIUM_TYPE_OPTIONS } from '../../../utils/options';

/* ─── Constants ──────────────────────────────────────────── */
const DURATION_OPTIONS = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30];

const PRODUCT_TYPE_ICONS = {
  HEALTH: 'bi-heart-pulse',
  LIFE:   'bi-shield-heart',
  MOTOR:  'bi-car-front',
  TRAVEL: 'bi-airplane',
};
const PRODUCT_TYPE_COLORS = {
  HEALTH: 'var(--ip-claim-rejected)',
  LIFE:   'var(--ip-success)',
  MOTOR:  'var(--ip-brand)',
  TRAVEL: '#0891b2',
};

const PREMIUM_CARD_META = {
  ANNUAL:   { icon: 'bi-calendar-check', desc: 'Premium billed once every year.' },
  ONE_TIME: { icon: 'bi-lightning-charge', desc: 'Single upfront payment, full term covered.' },
};

/* ─── Style helpers (inline, follow existing tokens) ─────── */
const card = {
  borderRadius: 'var(--ip-radius-lg)',
  boxShadow: 'var(--ip-shadow-md)',
  backgroundColor: 'var(--ip-surface)',
  border: '1px solid var(--ip-border)',
  overflow: 'hidden',
};

const inputStyle = {
  borderRadius: 'var(--ip-radius-sm)',
  border: '1.5px solid var(--ip-border)',
  padding: '0.6rem 0.85rem',
  fontSize: '0.88rem',
  backgroundColor: 'var(--ip-surface)',
  color: 'var(--ip-text-primary)',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  width: '100%',
};

const labelStyle = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--ip-text-muted)',
  marginBottom: '0.35rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  display: 'block',
};

/* ─── Sub-components ─────────────────────────────────────── */

/** Horizontal progress stepper — informational, not step-gated */
const PlanProgressBar = ({ sections }) => (
  <div
    className="d-flex align-items-start gap-0 mb-5"
    style={{ position: 'relative' }}
  >
    {sections.map((sec, i) => {
      const done  = sec.complete;
      const first = i === 0;
      return (
        <React.Fragment key={sec.label}>
          {/* connector line before */}
          {!first && (
            <div
              style={{
                flex: 1,
                height: 2,
                marginTop: 16,
                background: done
                  ? 'linear-gradient(90deg, var(--ip-success), var(--ip-success-border))'
                  : 'var(--ip-border)',
                transition: 'background 0.4s ease',
              }}
            />
          )}
          {/* step node */}
          <div
            className="d-flex flex-column align-items-center"
            style={{ minWidth: 72 }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
                fontWeight: 700,
                transition: 'all 0.3s ease',
                border: done
                  ? '2px solid var(--ip-success)'
                  : '2px solid var(--ip-border)',
                backgroundColor: done
                  ? 'var(--ip-success)'
                  : 'var(--ip-surface)',
                color: done ? '#fff' : 'var(--ip-text-muted)',
                boxShadow: done ? '0 0 0 4px rgba(22,163,74,0.15)' : 'none',
              }}
            >
              {done
                ? <i className="bi bi-check-lg" />
                : <span>{i + 1}</span>
              }
            </div>
            <span
              className="mt-1 text-center"
              style={{
                fontSize: '0.68rem',
                fontWeight: done ? 700 : 500,
                color: done ? 'var(--ip-success)' : 'var(--ip-text-muted)',
                maxWidth: 68,
                lineHeight: 1.2,
              }}
            >
              {sec.label}
            </span>
          </div>
        </React.Fragment>
      );
    })}
  </div>
);

/** Section card with left accent border + numbered header */
const SectionCard = ({ number, icon, title, description, accentColor = 'var(--ip-brand)', children }) => (
  <div
    className="create-plan-section animate-section-in"
    style={{
      ...card,
      borderLeft: `4px solid ${accentColor}`,
      marginBottom: '1.5rem',
    }}
  >
    {/* Header */}
    <div
      className="d-flex align-items-start gap-3 px-4 pt-4 pb-3"
      style={{ borderBottom: '1px solid var(--ip-border)' }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--ip-radius-md)',
          background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
          border: `1.5px solid ${accentColor}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
          fontSize: '1.1rem',
          flexShrink: 0,
        }}
      >
        <i className={`bi ${icon}`} />
      </div>
      <div style={{ flex: 1 }}>
        <div className="d-flex align-items-center gap-2">
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              color: accentColor,
              backgroundColor: `${accentColor}15`,
              borderRadius: 'var(--ip-radius-pill)',
              padding: '2px 8px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {String(number).padStart(2, '0')}
          </span>
          <h6
            className="mb-0 fw-bold"
            style={{ color: 'var(--ip-text-primary)', fontSize: '0.95rem' }}
          >
            {title}
          </h6>
        </div>
        <p
          className="mb-0 mt-1"
          style={{ fontSize: '0.78rem', color: 'var(--ip-text-muted)', lineHeight: 1.4 }}
        >
          {description}
        </p>
      </div>
    </div>
    {/* Body */}
    <div className="px-4 py-4">{children}</div>
  </div>
);

/** Duration chip toggle */
const DurationChip = ({ year, selected, onToggle }) => (
  <button
    type="button"
    className={`duration-chip${selected ? ' duration-chip--active' : ''}`}
    onClick={() => onToggle(year)}
    aria-pressed={selected}
    title={`${year} ${year === 1 ? 'Year' : 'Years'}`}
  >
    {selected && <i className="bi bi-check me-1" style={{ fontSize: '0.72rem' }} />}
    {year}{year === 1 ? 'Y' : 'Y'}
  </button>
);

/** Premium type toggle card */
const PremiumTypeCard = ({ value, label, selected, onSelect }) => {
  const meta = PREMIUM_CARD_META[value] || {};
  return (
    <div
      className={`premium-type-card${selected ? ' premium-type-card--active' : ''}`}
      onClick={() => onSelect(value)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(value); }}
      aria-pressed={selected}
    >
      <div className="d-flex align-items-start gap-3">
        <div
          className="premium-type-card__icon"
          style={{
            background: selected
              ? 'linear-gradient(135deg, var(--ip-brand), #764ba2)'
              : 'var(--ip-surface-raised)',
            color: selected ? '#fff' : 'var(--ip-text-muted)',
          }}
        >
          <i className={`bi ${meta.icon || 'bi-credit-card'}`} />
        </div>
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.88rem',
              color: selected ? 'var(--ip-brand)' : 'var(--ip-text-primary)',
              marginBottom: '0.2rem',
            }}
          >
            {label}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ip-text-muted)', lineHeight: 1.3 }}>
            {meta.desc}
          </div>
        </div>
        {selected && (
          <div className="ms-auto">
            <i className="bi bi-check-circle-fill" style={{ color: 'var(--ip-brand)', fontSize: '1.1rem' }} />
          </div>
        )}
      </div>
    </div>
  );
};

/** Right-side summary validation row */
const ValidationRow = ({ ok, text }) => (
  <div
    className="d-flex align-items-center gap-2 py-1"
    style={{ fontSize: '0.78rem' }}
  >
    <i
      className={`bi ${ok ? 'bi-check-circle-fill' : 'bi-exclamation-circle'}`}
      style={{ color: ok ? 'var(--ip-success)' : 'var(--ip-warning)', flexShrink: 0 }}
    />
    <span style={{ color: ok ? 'var(--ip-text-secondary)' : 'var(--ip-text-muted)' }}>
      {text}
    </span>
  </div>
);

/* ─── Main Page ───────────────────────────────────────────── */
const CreatePlanPage = () => {
  const navigate = useNavigate();
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [products,   setProducts]   = useState([]);

  const [form, setForm] = useState({
    planName:          '',
    productId:         '',
    premiumType:       'ANNUAL',
    durations:         [1, 2, 3, 5],
    coverageOptions:   [
      { id: Date.now(), label: 'Base Cover', amount: 500000 }
    ],
    baseRiskRate:      0.025,
    processingFee:     100,
    gst:               18,
    termsAndConditions:'',
  });

  /* load products */
  useEffect(() => {
    getAllProducts()
      .then((res) => {
        const list = res?.data || res || [];
        setProducts(Array.isArray(list) ? list : []);
      })
      .catch(() => notify.error('Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  /* smart defaults per product type */
  useEffect(() => {
    if (!form.productId || products.length === 0) return;
    const product = products.find((p) => (p.productId || p.id) == form.productId);
    if (!product) return;
    const defaults = { baseRiskRate: 0.02, processingFee: 100, gst: 18 };
    switch (product.productType) {
      case 'HEALTH': defaults.baseRiskRate = 0.025; defaults.processingFee = 100; defaults.gst = 0;  break;
      case 'LIFE':   defaults.baseRiskRate = 0.008; defaults.processingFee = 200; defaults.gst = 0;  break;
      case 'MOTOR':  defaults.baseRiskRate = 0.03;  defaults.processingFee = 150; defaults.gst = 18; break;
      case 'TRAVEL': defaults.baseRiskRate = 0.015; defaults.processingFee = 50;  defaults.gst = 18; break;
    }
    setForm((f) => ({ ...f, ...defaults }));
  }, [form.productId, products]);

  /* coverage validation helper */
  const getCoverageError = (opt, index) => {
    const amt = Number(opt.amount);
    if (!amt) return '';
    if (amt < 50000) return 'Coverage amount must be at least ₹50,000';
    if (amt % 50000 !== 0) return 'Coverage amount must be in multiples of ₹50,000';
    
    // Check for ascending / duplicate order
    if (index > 0) {
      const prevAmt = Number(form.coverageOptions[index - 1].amount);
      if (prevAmt) {
        if (amt === prevAmt) return 'Coverage amount already exists';
        if (amt < prevAmt) return 'Coverage amount must be greater than the previous coverage';
      }
    }
    return '';
  };

  const handleCoverageChange = (index, field, value) => {
    const updated = [...form.coverageOptions];
    updated[index][field] = value;
    setForm({ ...form, coverageOptions: updated });
  };

  const addCoverageOption = () => {
    // try to guess the next logical amount (previous amount + 1 Lakh)
    const lastAmt = form.coverageOptions.length > 0 
      ? Number(form.coverageOptions[form.coverageOptions.length - 1].amount) 
      : 400000;
    
    setForm({
      ...form,
      coverageOptions: [
        ...form.coverageOptions,
        { id: Date.now(), label: '', amount: (lastAmt || 0) + 100000 }
      ]
    });
  };

  const removeCoverageOption = (index) => {
    const updated = form.coverageOptions.filter((_, i) => i !== index);
    setForm({ ...form, coverageOptions: updated });
  };

  /* premium preview (sample: ₹5L) */
  const premiumPreview = useMemo(() => {
    const rate      = Number(form.baseRiskRate) || 0;
    const fee       = Number(form.processingFee) || 0;
    const gstPct    = Number(form.gst) || 0;
    const sample    = 500000;
    const base      = sample * rate;
    const beforeGst = base + fee;
    const gst       = beforeGst * (gstPct / 100);
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

  /* form validation */
  const isFormValid = useMemo(() => {
    if (!form.planName || form.planName.trim().length < 2)             return false;
    if (!form.productId)                                               return false;
    if (!form.premiumType)                                             return false;
    if (!form.durations || form.durations.length === 0)                return false;
    
    if (!form.coverageOptions || form.coverageOptions.length === 0)    return false;
    for (let i = 0; i < form.coverageOptions.length; i++) {
      const opt = form.coverageOptions[i];
      if (!opt.label || !opt.label.trim()) return false;
      const error = getCoverageError(opt, i);
      if (error || !opt.amount) return false;
    }

    if (form.baseRiskRate === '' || Number(form.baseRiskRate) < 0 || Number(form.baseRiskRate) > 1) return false;
    if (form.processingFee === '' || Number(form.processingFee) < 0)   return false;
    if (form.gst === '' || Number(form.gst) < 0)                       return false;
    if (!form.termsAndConditions || !form.termsAndConditions.trim())   return false;
    return true;
  }, [form]);

  /* progress sections */
  const progressSections = useMemo(() => {
    const coverageValid = form.coverageOptions.length > 0 && form.coverageOptions.every((opt, i) => {
      return opt.label.trim() && opt.amount && !getCoverageError(opt, i);
    });

    return [
      {
        label:    'Basic Info',
        complete: form.planName.trim().length >= 2 && !!form.productId,
      },
      {
        label:    'Coverage',
        complete: coverageValid,
      },
      {
        label:    'Policy Config',
        complete: form.durations.length > 0,
      },
      {
        label:    'Terms',
        complete: form.termsAndConditions.trim().length > 0,
      },
    ];
  }, [form.planName, form.productId, form.coverageOptions, form.durations, form.termsAndConditions]);

  /* submit */
  const handleSubmit = async () => {
    setError('');
    if (!form.planName.trim()) { const m = 'Plan name is required'; setError(m); return notify.error(m); }
    if (!form.productId)       { const m = 'Select a product';      setError(m); return notify.error(m); }
    if (form.durations.length === 0) { const m = 'Select at least one duration'; setError(m); return notify.error(m); }
    
    if (form.coverageOptions.length === 0) { const m = 'Add at least one coverage option'; setError(m); return notify.error(m); }
    for (let i = 0; i < form.coverageOptions.length; i++) {
      const opt = form.coverageOptions[i];
      if (!opt.label.trim()) { const m = `Label is required for coverage option ${i+1}`; setError(m); return notify.error(m); }
      const error = getCoverageError(opt, i);
      if (error || !opt.amount) { const m = error || `Invalid amount for ${opt.label}`; setError(m); return notify.error(m); }
    }

    if (!form.termsAndConditions.trim()) {
      const m = 'Terms & conditions are required'; setError(m); return notify.error(m);
    }
    setSubmitting(true);
    try {
      await createPlan({
        planDetails: {
          productId:            Number(form.productId),
          planName:             form.planName,
          supportedPremiumType: form.premiumType,
          allowedDurations:     form.durations,
          termsAndConditions:   form.termsAndConditions,
          activeStatus:         true,
        },
        coverageOptions: form.coverageOptions.map((opt, i) => ({
          coverageAmount: Number(opt.amount),
          label:          opt.label.trim(),
          displayOrder:   i + 1,
          activeStatus:   true,
        })),
        pricingRule: {
          baseRiskRate:  Number(form.baseRiskRate),
          processingFee: Number(form.processingFee),
          gst:           Number(form.gst),
          effectiveFrom: new Date().toISOString(),
          remarks:       `Created with plan: ${form.planName}`,
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
  const termsLen        = form.termsAndConditions.length;

  /* ─── RENDER ─────────────────────────────────────────────── */
  return (
    <div className="create-plan-page animate-section-in">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div
        className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3"
        style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--ip-border)' }}
      >
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-sm"
            style={{
              borderRadius: 'var(--ip-radius-sm)',
              border: '1.5px solid var(--ip-border)',
              color: 'var(--ip-text-muted)',
              padding: '0.4rem 0.8rem',
            }}
            onClick={() => navigate('/admin/plans')}
          >
            <i className="bi bi-arrow-left me-1" />
            Plans
          </button>
          <div>
            <h4
              className="mb-0 fw-bold"
              style={{ color: 'var(--ip-text-primary)', fontSize: '1.25rem' }}
            >
              Create Policy Plan
            </h4>
            <p
              className="mb-0 mt-1"
              style={{ fontSize: '0.8rem', color: 'var(--ip-text-muted)' }}
            >
              Configure coverage, premium settings, durations and business rules.
            </p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm"
            style={{
              borderRadius: 'var(--ip-radius-pill)',
              border: '1.5px solid var(--ip-border)',
              color: 'var(--ip-text-secondary)',
              padding: '0.45rem 1.1rem',
              fontWeight: 600,
            }}
            onClick={() => navigate('/admin/plans')}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="btn btn-sm"
            style={{
              borderRadius: 'var(--ip-radius-pill)',
              background: isFormValid
                ? 'linear-gradient(135deg, var(--ip-success) 0%, #15803d 100%)'
                : 'var(--ip-border)',
              color: '#fff',
              padding: '0.45rem 1.4rem',
              fontWeight: 700,
              cursor: !isFormValid ? 'not-allowed' : 'pointer',
              opacity: !isFormValid ? 0.65 : 1,
              boxShadow: isFormValid ? 'var(--ip-shadow-sm)' : 'none',
              border: 'none',
              transition: 'all 0.2s',
            }}
            onClick={handleSubmit}
            disabled={submitting || !isFormValid}
          >
            {submitting ? (
              <><span className="spinner-border spinner-border-sm me-2" />Creating…</>
            ) : (
              <><i className="bi bi-check-lg me-1" />Create Plan</>
            )}
          </button>
        </div>
      </div>

      {/* ── Guidelines ────────────────────────────────────────── */}
      <div className="mx-auto" style={{ maxWidth: '1000px' }}>
        <FormGuidelines
          title="Rules for Creating a Plan"
          rules={[
            "Plan Name must be at least 3 characters long.",
            "You must select an Active Product and a Premium Type.",
            "At least one Allowed Duration and one Coverage Option is required.",
            "All Coverage Options must have a valid label."
          ]}
        />
      </div>

      {/* ── Error ───────────────────────────────────────────── */}
      {error && (
        <div className="mx-auto" style={{ maxWidth: '1000px' }}>
          <ErrorAlert message={error} className="mb-4 fade-in" onClose={() => setError('')} />
        </div>
      )}

      {/* ── Progress Bar ────────────────────────────────────── */}
      <PlanProgressBar sections={progressSections} />

      {/* ── Two-column Layout ───────────────────────────────── */}
      <div className="row g-4 align-items-start">

        {/* ════ LEFT COLUMN — Sections ═══════════════════════ */}
        <div className="col-lg-7">

          {/* ── §1 Basic Information ──────────────────────── */}
          <SectionCard
            number={1}
            icon="bi-info-circle"
            title="Basic Information"
            description="Set up the core identity of this insurance plan."
            accentColor="var(--ip-brand)"
          >
            <div className="row g-3">
              {/* Product */}
              <div className="col-md-5">
                <label style={labelStyle}>Insurance Product *</label>
                <div style={{ position: 'relative' }}>
                  <SearchSelect
                    name="productId"
                    value={form.productId}
                    onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                    options={products.map((p) => {
                      let icon = 'Shield';
                      if (p.productType === 'HEALTH') icon = 'HeartPulse';
                      if (p.productType === 'LIFE') icon = 'User';
                      if (p.productType === 'MOTOR') icon = 'CarFront';
                      if (p.productType === 'TRAVEL') icon = 'Plane';
                      
                      return {
                        value: p.productId || p.id,
                        label: p.productName,
                        subtitle: p.productType,
                        icon: icon,
                        badge: 'Active',
                        statusColor: p.productType === 'LIFE' ? 'success' : 'brand'
                      };
                    })}
                    placeholder="Search insurance product…"
                    error={!form.productId && submitting ? 'Please select an insurance product' : ''}
                  />
                </div>
                {/* product badge */}
                {selectedProduct && (
                  <div className="mt-2 d-flex align-items-center gap-2">
                    <i
                      className={`bi ${PRODUCT_TYPE_ICONS[selectedProduct.productType] || 'bi-shield'}`}
                      style={{
                        color: PRODUCT_TYPE_COLORS[selectedProduct.productType] || 'var(--ip-brand)',
                        fontSize: '1rem',
                      }}
                    />
                    <span
                      className="badge"
                      style={{
                        backgroundColor: `${PRODUCT_TYPE_COLORS[selectedProduct.productType] || 'var(--ip-brand)'}15`,
                        color: PRODUCT_TYPE_COLORS[selectedProduct.productType] || 'var(--ip-brand)',
                        border: `1px solid ${PRODUCT_TYPE_COLORS[selectedProduct.productType] || 'var(--ip-brand)'}30`,
                        borderRadius: 'var(--ip-radius-pill)',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        padding: '3px 10px',
                      }}
                    >
                      {selectedProduct.productType}
                    </span>
                    <small style={{ color: 'var(--ip-text-muted)', fontSize: '0.72rem' }}>
                      {selectedProduct.productName}
                    </small>
                  </div>
                )}
                {!form.productId && (
                  <div className="text-danger small mt-1">
                    <i className="bi bi-exclamation-circle me-1" />Select an insurance product
                  </div>
                )}
              </div>

              {/* Plan Name */}
              <div className="col-md-7">
                <label style={labelStyle}>Plan Name *</label>
                <input
                  type="text"
                  className={`form-control ${form.planName.trim().length > 0 && form.planName.trim().length < 2 ? 'is-invalid' : ''}`}
                  style={inputStyle}
                  value={form.planName}
                  onChange={(e) => setForm((f) => ({ ...f, planName: e.target.value }))}
                  placeholder="e.g. Health Guard Platinum"
                  maxLength={100}
                />
                <div className="d-flex justify-content-between mt-1">
                  {form.planName.trim().length > 0 && form.planName.trim().length < 2 ? (
                    <span className="text-danger small">
                      <i className="bi bi-exclamation-circle me-1" />Minimum 2 characters
                    </span>
                  ) : (
                    <span />
                  )}
                  <span style={{ fontSize: '0.68rem', color: 'var(--ip-text-muted)' }}>
                    {form.planName.length}/100
                  </span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── §2 Coverage Configuration ─────────────────── */}
          <SectionCard
            number={2}
            icon="bi-shield-check"
            title="Coverage Configuration"
            description="Manually build the list of coverage options available for this plan."
            accentColor="var(--ip-success)"
          >
            
            <div className="mb-3 d-flex justify-content-between align-items-center">
              <div>
                <label style={labelStyle} className="mb-0">Coverage Options</label>
                <small style={{ color: 'var(--ip-text-muted)', fontSize: '0.75rem' }}>
                  Minimum ₹50,000 · Allowed Increment ₹50,000
                </small>
              </div>
            </div>

            <div className="d-flex flex-column gap-3 mb-4">
              {form.coverageOptions.map((opt, index) => {
                const errorMsg = getCoverageError(opt, index);
                const hasLabelError = !opt.label.trim();
                return (
                  <div key={opt.id} className="p-3" style={{ 
                    border: '1px solid var(--ip-border)', 
                    borderRadius: 'var(--ip-radius-md)',
                    backgroundColor: (errorMsg || hasLabelError) ? 'var(--ip-danger-bg)' : 'var(--ip-surface-raised)',
                    borderColor: (errorMsg || hasLabelError) ? 'var(--ip-danger-border)' : 'var(--ip-border)',
                    transition: 'all 0.2s ease'
                  }}>
                    <div className="d-flex gap-3 align-items-start">
                      
                      {/* Label Input */}
                      <div className="flex-grow-1">
                        <label style={{ fontSize: '0.7rem', color: 'var(--ip-text-muted)', fontWeight: 600, marginBottom: '0.2rem' }}>Label *</label>
                        <input
                          type="text"
                          className={`form-control ${hasLabelError ? 'is-invalid' : ''}`}
                          style={{...inputStyle, padding: '0.5rem 0.75rem', fontSize: '0.82rem'}}
                          placeholder="e.g. Silver Cover"
                          value={opt.label}
                          onChange={(e) => handleCoverageChange(index, 'label', e.target.value)}
                        />
                      </div>

                      {/* Amount Input */}
                      <div className="flex-grow-1">
                        <label style={{ fontSize: '0.7rem', color: 'var(--ip-text-muted)', fontWeight: 600, marginBottom: '0.2rem' }}>Coverage Amount (₹) *</label>
                        <input
                          type="number"
                          className={`form-control ${errorMsg ? 'is-invalid' : ''}`}
                          style={{...inputStyle, padding: '0.5rem 0.75rem', fontSize: '0.82rem'}}
                          placeholder="Amount"
                          value={opt.amount === '' ? '' : opt.amount}
                          onChange={(e) => handleCoverageChange(index, 'amount', e.target.value ? Number(e.target.value) : '')}
                          onKeyDown={(e) => { if (e.key === '.' || e.key === 'e') e.preventDefault(); }}
                        />
                      </div>

                      {/* Remove Button */}
                      <div style={{ paddingTop: '1.45rem' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          style={{ borderRadius: 'var(--ip-radius-md)', padding: '0.45rem 0.6rem' }}
                          onClick={() => removeCoverageOption(index)}
                          title="Remove option"
                          disabled={form.coverageOptions.length === 1} // Prevent removing last option
                        >
                          <i className="bi bi-trash3" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Validation Display */}
                    {(errorMsg || hasLabelError) && (
                      <div className="mt-2 text-danger" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        <i className="bi bi-exclamation-circle me-1" />
                        {errorMsg || 'Label cannot be empty.'}
                      </div>
                    )}
                    {(!errorMsg && opt.amount >= 50000) && (
                      <div className="mt-2 text-success" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                        <i className="bi bi-check-circle me-1" />
                        Valid (₹{Number(opt.amount).toLocaleString('en-IN')})
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="btn btn-sm"
              style={{
                borderRadius: 'var(--ip-radius-pill)',
                border: '1.5px dashed var(--ip-success)',
                color: 'var(--ip-success)',
                backgroundColor: 'var(--ip-success-bg)',
                padding: '0.45rem 1.1rem',
                fontWeight: 600,
                width: '100%'
              }}
              onClick={addCoverageOption}
            >
              <i className="bi bi-plus-lg me-2" />
              Add Coverage Option
            </button>
            {form.coverageOptions.length === 0 && (
              <div className="text-danger small mt-2 text-center">
                <i className="bi bi-exclamation-circle me-1" />Add at least one coverage option
              </div>
            )}
          </SectionCard>

          {/* ── §3 Policy Configuration ───────────────────── */}
          <SectionCard
            number={3}
            icon="bi-sliders"
            title="Policy Configuration"
            description="Set allowed policy durations and premium payment structure."
            accentColor="#7c3aed"
          >
            {/* Durations */}
            <div className="mb-4">
              <label style={labelStyle}>Allowed Durations *</label>
              <p style={{ fontSize: '0.78rem', color: 'var(--ip-text-muted)', marginBottom: '0.75rem' }}>
                Select durations that will be available when customers purchase.
              </p>
              <div style={{ position: 'relative' }}>
                <SearchSelect
                  name="durations"
                  isMulti={true}
                  isCreatable={true}
                  value={form.durations}
                  onChange={(e) => setForm((f) => ({ ...f, durations: e.target.value.map(v => parseInt(v, 10)).filter(n => !isNaN(n)).sort((a,b)=>a-b) }))}
                  options={DURATION_OPTIONS.map(yr => ({
                    value: yr,
                    label: `${yr} ${yr === 1 ? 'Year' : 'Years'}`,
                    icon: 'Calendar'
                  }))}
                  placeholder="Select or type custom (e.g. 12)..."
                  error={form.durations.length === 0 && submitting ? 'Select at least one duration' : ''}
                />
              </div>
            </div>

            {/* Premium Type */}
            <div>
              <label style={labelStyle}>Premium Payment Type</label>
              <p style={{ fontSize: '0.78rem', color: 'var(--ip-text-muted)', marginBottom: '0.75rem' }}>
                Choose how customers will pay their premium for this plan.
              </p>
              <div className="row g-3">
                {PREMIUM_TYPE_OPTIONS.map((opt) => (
                  <div key={opt.value} className="col-md-6">
                    <PremiumTypeCard
                      value={opt.value}
                      label={opt.label}
                      selected={form.premiumType === opt.value}
                      onSelect={(v) => setForm((f) => ({ ...f, premiumType: v }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* ── §4 Pricing Rule ───────────────────────────── */}
          <SectionCard
            number={4}
            icon="bi-calculator"
            title="Pricing Rule"
            description="Define base risk rate, processing fee and tax to calculate premiums."
            accentColor="var(--ip-warning)"
          >
            <div className="row g-3">
              <div className="col-md-4">
                <label style={labelStyle}>Base Risk Rate (0–1)</label>
                <div style={{ position: 'relative' }}>
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
                </div>
                <div className="mt-1">
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      backgroundColor: 'var(--ip-brand-light)',
                      color: 'var(--ip-brand)',
                      borderRadius: 'var(--ip-radius-pill)',
                      padding: '2px 8px',
                    }}
                  >
                    {(Number(form.baseRiskRate) * 100).toFixed(2)}% annual risk
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
          </SectionCard>

          {/* ── §5 Terms & Conditions ─────────────────────── */}
          <SectionCard
            number={5}
            icon="bi-file-text"
            title="Terms & Conditions"
            description="Document the coverage rules, exclusions and policy obligations."
            accentColor="var(--ip-info)"
          >
            <textarea
              className={`form-control ${form.termsAndConditions.trim().length === 0 ? 'is-invalid' : ''}`}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: 140,
                lineHeight: 1.6,
              }}
              rows={6}
              value={form.termsAndConditions}
              onChange={(e) => setForm((f) => ({ ...f, termsAndConditions: e.target.value }))}
              placeholder="Describe coverage terms, exclusions, claims process and policy obligations…"
            />
            <div className="d-flex justify-content-between mt-1">
              {form.termsAndConditions.trim().length === 0 ? (
                <span className="text-danger small">
                  <i className="bi bi-exclamation-circle me-1" />Terms & conditions are required
                </span>
              ) : (
                <span className="small" style={{ color: 'var(--ip-success)', fontSize: '0.75rem' }}>
                  <i className="bi bi-check-circle me-1" />Terms provided
                </span>
              )}
              <span style={{ fontSize: '0.68rem', color: 'var(--ip-text-muted)' }}>
                {termsLen} characters
              </span>
            </div>
          </SectionCard>

          {/* ── Bottom Submit ─────────────────────────────── */}
          {!isFormValid && (
            <div
              className="d-flex align-items-start gap-3 p-3 mb-3"
              style={{
                borderRadius: 'var(--ip-radius-md)',
                backgroundColor: 'var(--ip-danger-bg)',
                border: '1px solid var(--ip-danger-border)',
              }}
            >
              <i className="bi bi-exclamation-triangle-fill mt-1" style={{ color: 'var(--ip-danger)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ip-danger)' }}>
                  Form Incomplete
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ip-text-muted)', marginTop: 2 }}>
                  Complete all required fields to enable the Create Plan button.
                </div>
              </div>
            </div>
          )}
          <div className="d-flex justify-content-end gap-3 pb-4">
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
                background: isFormValid
                  ? 'linear-gradient(135deg, var(--ip-success) 0%, #15803d 100%)'
                  : 'var(--ip-border)',
                color: '#fff',
                boxShadow: isFormValid ? 'var(--ip-shadow-sm)' : 'none',
                cursor: !isFormValid ? 'not-allowed' : 'pointer',
                opacity: !isFormValid ? 0.65 : 1,
                border: 'none',
                transition: 'all 0.2s',
              }}
              onClick={handleSubmit}
              disabled={submitting || !isFormValid}
            >
              {submitting ? (
                <><span className="spinner-border spinner-border-sm me-2" />Creating…</>
              ) : (
                <><i className="bi bi-check-lg me-2" />Create Plan</>
              )}
            </button>
          </div>
        </div>

        {/* ════ RIGHT COLUMN — Live Summary Panel ════════════ */}
        <div className="col-lg-5">
          <div
            className="sticky-top"
            style={{ top: 80 }}
          >
            {/* Summary card */}
            <div
              style={{
                ...card,
                overflow: 'hidden',
                borderLeft: '4px solid var(--ip-brand)',
              }}
            >
              {/* Header gradient */}
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--ip-brand) 0%, #764ba2 100%)',
                  padding: '1.25rem 1.25rem 1rem',
                  color: '#fff',
                }}
              >
                <div className="d-flex align-items-center gap-2 mb-1">
                  <i className="bi bi-eye-fill opacity-75" />
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.85 }}>
                    Live Summary
                  </span>
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                  {form.planName || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Plan Name…</span>}
                </div>
                {selectedProduct && (
                  <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: '0.2rem' }}>
                    <i className={`bi ${PRODUCT_TYPE_ICONS[selectedProduct.productType] || 'bi-shield'} me-1`} />
                    {selectedProduct.productName} · {selectedProduct.productType}
                  </div>
                )}
                {/* badges */}
                <div className="d-flex flex-wrap gap-1 mt-2">
                  {form.coverageOptions.length > 0 && form.coverageOptions.every((o, i) => o.amount && o.label && !getCoverageError(o, i)) && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 'var(--ip-radius-pill)', padding: '2px 8px' }}>
                      {form.coverageOptions.length} Coverage Options
                    </span>
                  )}
                  {form.durations.length > 0 && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 'var(--ip-radius-pill)', padding: '2px 8px' }}>
                      {form.durations.length} Duration{form.durations.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {form.premiumType && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 'var(--ip-radius-pill)', padding: '2px 8px' }}>
                      {form.premiumType.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4">
                {/* Plan details grid */}
                <div className="mb-3">

                  {/* Product row */}
                  <div className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: '1px solid var(--ip-border)', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--ip-text-muted)', fontWeight: 600, minWidth: 100 }}>Product</span>
                    <span style={{ color: 'var(--ip-text-primary)', fontWeight: 700, textAlign: 'right' }}>
                      {selectedProduct ? (
                        <span className="d-flex align-items-center gap-1 justify-content-end">
                          <i className={`bi ${PRODUCT_TYPE_ICONS[selectedProduct.productType] || 'bi-shield'}`}
                            style={{ color: PRODUCT_TYPE_COLORS[selectedProduct.productType] || 'var(--ip-brand)', fontSize: '0.85rem' }}/>
                          {selectedProduct.productName}
                        </span>
                      ) : '—'}
                    </span>
                  </div>

                  {/* Coverage Options List */}
                  <div className="py-2" style={{ borderBottom: '1px solid var(--ip-border)' }}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span style={{ color: 'var(--ip-text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>Coverage Options</span>
                      {form.coverageOptions.length > 0 && (
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 800,
                          backgroundColor: 'var(--ip-success)', color: '#fff',
                          borderRadius: 'var(--ip-radius-pill)', padding: '2px 7px',
                        }}>
                          {form.coverageOptions.length}
                        </span>
                      )}
                    </div>
                    {form.coverageOptions.length > 0 ? (
                      <div className="mt-2">
                        {form.coverageOptions.map((opt, i) => {
                          const hasErr = getCoverageError(opt, i) || !opt.label.trim();
                          return (
                            <div key={opt.id} className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '0.78rem' }}>
                              <span style={{ color: hasErr ? 'var(--ip-danger)' : 'var(--ip-text-primary)' }}>
                                <i className={`bi ${hasErr ? 'bi-exclamation-circle' : 'bi-check2'} me-1`} style={{ color: hasErr ? 'var(--ip-danger)' : 'var(--ip-success)' }} />
                                {opt.label || <span className="fst-italic">Unnamed</span>}
                              </span>
                              <span style={{ fontWeight: 700, color: hasErr ? 'var(--ip-danger)' : 'var(--ip-text-secondary)' }}>
                                {opt.amount ? `₹${Number(opt.amount).toLocaleString('en-IN')}` : '—'}
                              </span>
                            </div>
                          )
                        })}
                        
                        {/* Range Summary */}
                        {form.coverageOptions.every(o => o.amount) && (
                          <div className="mt-2 pt-1 border-top" style={{ fontSize: '0.7rem', color: 'var(--ip-text-muted)' }}>
                            Range: ₹{Number(form.coverageOptions[0].amount).toLocaleString('en-IN')} → ₹{Number(form.coverageOptions[form.coverageOptions.length - 1].amount).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--ip-text-muted)', fontStyle: 'italic' }}>None added</span>
                    )}
                  </div>

                  {/* Durations as pills */}
                  <div className="py-2" style={{ borderBottom: '1px solid var(--ip-border)' }}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span style={{ color: 'var(--ip-text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>Durations</span>
                    </div>
                    {form.durations.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        {form.durations.map((d) => (
                          <span key={d} style={{
                            fontSize: '0.68rem', fontWeight: 700,
                            backgroundColor: '#7c3aed15', color: '#7c3aed',
                            border: '1px solid #7c3aed30',
                            borderRadius: 'var(--ip-radius-pill)', padding: '2px 7px',
                          }}>
                            {d}{d === 1 ? ' Yr' : ' Yrs'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--ip-text-muted)', fontStyle: 'italic' }}>None selected</span>
                    )}
                  </div>

                  {/* Premium type + Risk Rate */}
                  {[
                    { label: 'Premium Type', value: form.premiumType?.replace('_', ' ') || '—' },
                    { label: 'Risk Rate',    value: `${(Number(form.baseRiskRate) * 100).toFixed(2)}%` },
                  ].map((row) => (
                    <div key={row.label} className="d-flex justify-content-between align-items-center py-2"
                      style={{ borderBottom: '1px solid var(--ip-border)', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--ip-text-muted)', fontWeight: 600, minWidth: 100 }}>{row.label}</span>
                      <span style={{ color: 'var(--ip-text-primary)', fontWeight: 700 }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Validation summary */}
                <div
                  className="mb-3 p-3"
                  style={{
                    borderRadius: 'var(--ip-radius-md)',
                    backgroundColor: 'var(--ip-surface-raised)',
                    border: '1px solid var(--ip-border)',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--ip-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Validation
                  </div>
                  <ValidationRow ok={form.planName.trim().length >= 2} text="Plan name (min 2 chars)" />
                  <ValidationRow ok={!!form.productId}                 text="Insurance product selected" />
                  <ValidationRow ok={form.coverageOptions.length > 0 && form.coverageOptions.every((o, i) => o.amount && o.label && !getCoverageError(o, i))} text={`Coverage options valid (${form.coverageOptions.length})`} />
                  <ValidationRow ok={form.durations.length > 0}       text={`Durations selected (${form.durations.length})`} />
                  <ValidationRow ok={!!form.premiumType}               text="Premium type chosen" />
                  <ValidationRow ok={form.termsAndConditions.trim().length > 0} text="Terms & conditions added" />
                </div>

                {/* Premium preview */}
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--ip-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Premium Preview · ₹5 Lakhs Coverage
                  </div>
                  <div className="row g-2">
                    {[
                      { label: 'Base',        value: premiumPreview.base,  color: 'var(--ip-brand)' },
                      { label: 'Fee',         value: premiumPreview.fee,   color: 'var(--ip-text-secondary)' },
                      { label: `GST ${form.gst}%`, value: premiumPreview.gst, color: 'var(--ip-text-secondary)' },
                      { label: 'Total',       value: premiumPreview.total, color: 'var(--ip-success)', big: true },
                    ].map((item) => (
                      <div key={item.label} className="col-6">
                        <div
                          style={{
                            borderRadius: 'var(--ip-radius-sm)',
                            backgroundColor: item.big ? 'var(--ip-success-bg)' : 'var(--ip-surface-raised)',
                            border: item.big ? '1px solid var(--ip-success-border)' : '1px solid var(--ip-border)',
                            padding: '0.5rem 0.65rem',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: '0.65rem', color: 'var(--ip-text-muted)', marginBottom: 2 }}>{item.label}</div>
                          <div style={{ fontSize: item.big ? '0.98rem' : '0.85rem', fontWeight: 800, color: item.color }}>
                            ₹{item.value.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ready state */}
                <div className="mt-3">
                  {isFormValid ? (
                    <div
                      className="d-flex align-items-center gap-2 p-3"
                      style={{
                        borderRadius: 'var(--ip-radius-md)',
                        backgroundColor: 'var(--ip-success-bg)',
                        border: '1px solid var(--ip-success-border)',
                      }}
                    >
                      <i className="bi bi-check-circle-fill" style={{ color: 'var(--ip-success)', fontSize: '1.1rem' }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ip-success)' }}>
                        Ready to Create Plan
                      </span>
                    </div>
                  ) : (
                    <div
                      className="d-flex align-items-center gap-2 p-3"
                      style={{
                        borderRadius: 'var(--ip-radius-md)',
                        backgroundColor: 'var(--ip-warning-bg)',
                        border: '1px solid var(--ip-warning-border)',
                      }}
                    >
                      <i className="bi bi-hourglass-split" style={{ color: 'var(--ip-warning)', fontSize: '1rem' }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ip-warning)' }}>
                        Complete all sections to create
                      </span>
                    </div>
                  )}
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
