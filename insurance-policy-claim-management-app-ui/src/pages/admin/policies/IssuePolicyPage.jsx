import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import { getAllCustomers } from '../../../services/customerService';
import { getAllPlans } from '../../../services/planService';
import { generateQuoteAsAdmin } from '../../../services/quoteService';
import { issuePolicy } from '../../../services/policyService';
import { notify } from '../../../utils/notificationService';

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
};

const labelStyle = {
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'var(--ip-text-muted)',
  marginBottom: '0.35rem',
};

const IssuePolicyPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [form, setForm] = useState({
    customerId: '',
    planId: '',
    duration: '',
    coverageAmount: '',
    premiumType: 'ANNUAL',
  });

  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([
      getAllCustomers().catch(() => []),
      getAllPlans().catch(() => []),
    ]).then(([customersData, plansData]) => {
      setCustomers(customersData || []);
      setPlans(plansData || []);
    });
  }, []);

  useEffect(() => {
    if (form.planId) {
      const plan = plans.find(p => (p.planId || p.id) === Number(form.planId));
      setSelectedPlan(plan || null);
      setQuote(null);
      const planPremiumType = plan?.supportedPremiumType || plan?.supportedPremiumTypes?.[0] || 'ANNUAL';
      setForm(f => ({ ...f, duration: '', coverageAmount: '', premiumType: planPremiumType }));
    }
  }, [form.planId, plans]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(err => ({ ...err, [name]: '' }));
    if (name === 'planId') setQuote(null);
  };

  const handleGetQuote = async () => {
    const errs = {};
    if (!form.customerId) errs.customerId = 'Select a customer';
    if (!form.planId) errs.planId = 'Select a plan';
    if (!form.duration) errs.duration = 'Select a duration';
    if (!form.coverageAmount || Number(form.coverageAmount) <= 0) errs.coverageAmount = 'Enter a valid amount';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setQuoteLoading(true);
    try {
      const res = await generateQuoteAsAdmin({
        customerId: Number(form.customerId),
        planId: Number(form.planId),
        coverageAmount: Number(form.coverageAmount),
        duration: Number(form.duration),
        premiumType: form.premiumType,
      });
      setQuote(res);
    } catch (err) {
      setQuote(null);
      notify.error(err?.message || 'Failed to generate quote');
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!quote) return notify.error('Generate a quote first');

    setSubmitting(true);
    try {
      await issuePolicy({
        customerId: Number(form.customerId),
        quoteId: quote.quoteId,
        startDate: new Date().toISOString().split('T')[0],
      });
      notify.success('Policy issued successfully!');
      navigate('/admin/policies');
    } catch (err) {
      if (err.fieldErrors) {
        setErrors(err.fieldErrors);
        notify.error('Please correct the highlighted fields.');
      } else {
        notify.error(err.message || 'Failed to issue policy');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const durations = selectedPlan?.allowedDurations || [];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <PageHeader
        title="Issue Policy"
        subtitle="Issue an insurance policy to a customer"
        onBack={() => navigate('/admin/policies')}
      />

      <div className="d-flex flex-column gap-4">
        {/* Customer & Plan */}
        <div className="card border-0" style={sectionCard}>
          <div className="card-body p-4">
            <div style={sectionHeader}>
              <i className="bi bi-person me-2" style={{ color: 'var(--ip-brand)' }} />
              Customer & Plan
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label style={labelStyle}>Customer *</label>
                <select
                  className={`form-select ${errors.customerId ? 'is-invalid' : ''}`}
                  style={inputStyle}
                  value={form.customerId}
                  onChange={handleChange}
                  name="customerId"
                >
                  <option value="">Select customer...</option>
                  {customers.map(c => (
                    <option key={c.id || c.customerId} value={c.id || c.customerId}>
                      {c.fullName || c.name} ({c.email})
                    </option>
                  ))}
                </select>
                {errors.customerId && <div className="invalid-feedback">{errors.customerId}</div>}
              </div>
              <div className="col-md-6">
                <label style={labelStyle}>Plan *</label>
                <select
                  className={`form-select ${errors.planId ? 'is-invalid' : ''}`}
                  style={inputStyle}
                  value={form.planId}
                  onChange={handleChange}
                  name="planId"
                >
                  <option value="">Select plan...</option>
                  {plans.map(p => (
                    <option key={p.planId || p.id} value={p.planId || p.id}>
                      {p.planName || p.name}
                    </option>
                  ))}
                </select>
                {errors.planId && <div className="invalid-feedback">{errors.planId}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Coverage Configuration */}
        <div className="card border-0" style={sectionCard}>
          <div className="card-body p-4">
            <div style={sectionHeader}>
              <i className="bi bi-shield-check me-2" style={{ color: 'var(--ip-brand)' }} />
              Coverage Configuration
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label style={labelStyle}>Duration *</label>
                <select
                  className={`form-select ${errors.duration ? 'is-invalid' : ''}`}
                  style={inputStyle}
                  value={form.duration}
                  onChange={handleChange}
                  name="duration"
                >
                  <option value="">Select...</option>
                  {durations.map(yr => (
                    <option key={yr} value={yr}>{yr} {yr === 1 ? 'Year' : 'Years'}</option>
                  ))}
                </select>
                {errors.duration && <div className="invalid-feedback">{errors.duration}</div>}
              </div>
              <div className="col-md-6">
                <label style={labelStyle}>Premium Type</label>
                <div
                  className="d-flex align-items-center"
                  style={{ ...inputStyle, backgroundColor: 'var(--ip-surface-raised)', cursor: 'default' }}
                >
                  <i className="bi bi-credit-card me-2" style={{ color: 'var(--ip-brand)' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                    {form.premiumType ? form.premiumType.replace('_', ' ') : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Coverage Slabs */}
            {selectedPlan?.coverageOptions?.length > 0 ? (
              <div>
                <label style={labelStyle}>Coverage Slab *</label>
                <div className="d-flex flex-wrap gap-2">
                  {selectedPlan.coverageOptions
                    .filter(opt => (opt.isActive ?? opt.active) !== false)
                    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                    .map((opt) => {
                      const amt = Number(opt.coverageAmount);
                      const selected = Number(form.coverageAmount) === amt;
                      return (
                        <button
                          key={opt.id || amt}
                          type="button"
                          className="btn"
                          style={{
                            borderRadius: 'var(--ip-radius-pill)',
                            padding: '0.5rem 1.1rem',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            border: selected ? 'none' : '1.5px solid var(--ip-border)',
                            backgroundColor: selected ? 'var(--ip-brand)' : 'transparent',
                            color: selected ? '#fff' : 'var(--ip-text-secondary)',
                            transition: 'all 0.2s',
                          }}
                          onClick={() => {
                            setForm(f => ({ ...f, coverageAmount: amt }));
                            setQuote(null);
                            if (errors.coverageAmount) setErrors(e => ({ ...e, coverageAmount: '' }));
                          }}
                        >
                          {opt.label || `₹${(amt / 100000).toLocaleString('en-IN')}L`}
                        </button>
                      );
                    })}
                </div>
                {errors.coverageAmount && (
                  <div className="text-danger small mt-1">
                    <i className="bi bi-exclamation-circle me-1" />
                    {errors.coverageAmount}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-3 text-muted small">
                <i className="bi bi-info-circle me-1" />
                Select a plan to see coverage options
              </div>
            )}

            <div className="text-center mt-3">
              <button
                className="btn"
                style={{
                  borderRadius: 'var(--ip-radius-pill)',
                  padding: '0.5rem 2rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--ip-brand)',
                  color: '#fff',
                }}
                onClick={handleGetQuote}
                disabled={quoteLoading || !form.planId}
              >
                {quoteLoading ? (
                  <><span className="spinner-border spinner-border-sm me-2" /> Generating...</>
                ) : (
                  <><i className="bi bi-calculator me-2" /> Generate Quote</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quote Result */}
        {quote && (
          <div className="card border-0" style={{ ...sectionCard, borderLeft: '4px solid var(--ip-success)' }}>
            <div className="card-body p-4">
              <div style={sectionHeader}>
                <i className="bi bi-check-circle me-2" style={{ color: 'var(--ip-success)' }} />
                Premium Quote
              </div>
              <div className="row g-3">
                {[
                  { label: 'Annual Premium', value: quote.annualPremium },
                  { label: 'Processing Fee', value: quote.processingFee },
                  { label: 'GST', value: quote.gst },
                ].map((item) => (
                  <div className="col-md-4" key={item.label}>
                    <div
                      className="p-3 text-center"
                      style={{ borderRadius: 'var(--ip-radius-sm)', backgroundColor: 'var(--ip-surface-raised)' }}
                    >
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>{item.label}</div>
                      <div className="fw-bold" style={{ color: 'var(--ip-brand)', fontSize: '1.05rem' }}>
                        ₹{Number(item.value).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="col-md-4">
                  <div
                    className="p-3 text-center"
                    style={{ borderRadius: 'var(--ip-radius-sm)', backgroundColor: 'var(--ip-success-subtle)' }}
                  >
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>Total</div>
                    <div className="fw-bold" style={{ color: 'var(--ip-success)', fontSize: '1.15rem' }}>
                      ₹{Number(quote.totalPremium).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="d-flex justify-content-end gap-3 pb-2">
          <button
            className="btn px-4"
            style={{
              borderRadius: 'var(--ip-radius-pill)',
              fontWeight: 600,
              border: '1.5px solid var(--ip-border)',
              color: 'var(--ip-text-secondary)',
            }}
            onClick={() => navigate('/admin/policies')}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="btn px-5"
            style={{
              borderRadius: 'var(--ip-radius-pill)',
              fontWeight: 700,
              backgroundColor: quote ? 'var(--ip-success)' : 'var(--ip-surface-raised)',
              color: quote ? '#fff' : 'var(--ip-text-muted)',
            }}
            onClick={handleSubmit}
            disabled={submitting || !quote}
          >
            {submitting ? (
              <><span className="spinner-border spinner-border-sm me-2" /> Issuing...</>
            ) : (
              <><i className="bi bi-check-lg me-2" /> Issue Policy</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssuePolicyPage;
