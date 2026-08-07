import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorAlert from '../../../components/ui/ErrorAlert';
import FormGuidelines from '../../../components/ui/FormGuidelines';
import CoverageOptionsManager from '../../../components/admin/CoverageOptionsManager';
import { getAllProducts } from '../../../services/productService';
import { getPlanById, updatePlan } from '../../../services/planService';
import { getCoverageOptions } from '../../../services/coverageOptionService';
import { notify } from '../../../utils/notificationService';
import { PREMIUM_TYPE_OPTIONS } from '../../../utils/options';
import SearchSelect from '../../../components/forms/SearchSelect';

const DURATION_OPTIONS = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30];

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

const EditPlanPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [coverageOptions, setCoverageOptions] = useState([]);

  const [form, setForm] = useState({
    planName: '',
    productId: '',
    premiumType: 'ANNUAL',
    durations: [],
    termsAndConditions: '',
    activeStatus: true,
  });

  const refreshCoverage = useCallback(async () => {
    try {
      const res = await getCoverageOptions(id);
      const list = res?.data || res || [];
      setCoverageOptions(Array.isArray(list) ? list : []);
    } catch {
      // non-fatal — plan data may embed coverage options
    }
  }, [id]);

  useEffect(() => {
    const fetchPlanAndProducts = async () => {
      try {
        const [planRes, productsRes] = await Promise.all([
          getPlanById(id),
          getAllProducts(),
        ]);

        const plan = planRes.data || planRes;
        const prodList = Array.isArray(productsRes)
          ? productsRes
          : productsRes.data || [];

        setProducts(prodList);
        setForm({
          planName: plan.planName || '',
          productId: plan.productId || '',
          premiumType: plan.supportedPremiumType || 'ANNUAL',
          durations: plan.allowedDurations || [],
          termsAndConditions: plan.termsAndConditions || '',
          activeStatus: plan.activeStatus ?? plan.isActive ?? plan.active ?? true,
        });
        // Seed coverage from plan data first, then refresh from dedicated endpoint
        setCoverageOptions(plan.coverageOptions || []);
        refreshCoverage();
      } catch (err) {
        setError(err.message || 'Failed to load plan details');
      } finally {
        setLoading(false);
      }
    };
    fetchPlanAndProducts();
  }, [id, refreshCoverage]);

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
    if (!form.durations || form.durations.length === 0) return false;
    if (!form.termsAndConditions || !form.termsAndConditions.trim()) return false;
    return true;
  }, [form]);

  const handleSubmit = async () => {
    setFormError('');
    if (!form.planName.trim()) {
      const msg = 'Plan name is required';
      setFormError(msg); return notify.error(msg);
    }
    if (!form.productId) {
      const msg = 'Select a product';
      setFormError(msg); return notify.error(msg);
    }
    if (form.durations.length === 0) {
      const msg = 'Select at least one duration';
      setFormError(msg); return notify.error(msg);
    }
    if (!form.termsAndConditions.trim()) {
      const msg = 'Terms & conditions are required';
      setFormError(msg); return notify.error(msg);
    }

    setSubmitting(true);
    try {
      await updatePlan(id, {
        productId: Number(form.productId),
        planName: form.planName,
        supportedPremiumType: form.premiumType,
        allowedDurations: form.durations,
        termsAndConditions: form.termsAndConditions,
        activeStatus: form.activeStatus ?? true,
      });
      notify.success('Plan updated successfully!');
      navigate(`/admin/plans/${id}`);
    } catch (err) {
      const msg = err.message || 'Failed to update plan';
      setFormError(msg);
      notify.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading plan details..." />;
  if (error) {
    return (
      <div>
        <PageHeader title="Edit Plan" onBack={() => navigate('/admin/plans')} />
        <ErrorAlert message={error} />
      </div>
    );
  }

  const selectedProduct = products.find((p) => (p.productId || p.id) == form.productId);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <PageHeader
        title="Edit Plan"
        subtitle={form.planName}
        onBack={() => navigate(`/admin/plans/${id}`)}
      />

      <FormGuidelines
        title="Rules for Editing a Plan"
        rules={[
          "Plan Name must be at least 3 characters long.",
          "You must select an Active Product and a Premium Type.",
          "At least one Allowed Duration and one Coverage Option is required.",
          "All Coverage Options must have a valid label."
        ]}
        defaultExpanded={false}
      />

      {formError && (
        <div className="mb-4">
          <ErrorAlert message={formError} onClose={() => setFormError('')} />
        </div>
      )}

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
                  placeholder="Select product..."
                  error={!form.productId ? 'Please select an insurance product' : ''}
                />
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
                error={form.durations.length === 0 ? 'Select at least one duration' : ''}
              />
            </div>
            {form.durations.length === 0 && (
              <div className="text-danger small mt-2">
                <i className="bi bi-exclamation-circle me-1" />
                Select at least one duration
              </div>
            )}
          </div>
        </div>

        {/* Coverage Options Manager */}
        <CoverageOptionsManager
          planId={id}
          existingOptions={coverageOptions}
          onUpdate={refreshCoverage}
        />

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

        {/* Plan Status */}
        <div className="card border-0" style={sectionCard}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div style={sectionHeader}>
                  <i className="bi bi-toggle-on me-2" style={{ color: 'var(--ip-brand)' }} />
                  Plan Status
                </div>
                <div className="small text-muted">Toggle whether this plan is actively available for purchase</div>
              </div>
              <div className="form-check form-switch fs-5 mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="activeStatusSwitch"
                  checked={form.activeStatus}
                  onChange={(e) => setForm((f) => ({ ...f, activeStatus: e.target.checked }))}
                />
                <label className="form-check-label fs-6 ms-2" htmlFor="activeStatusSwitch">
                  {form.activeStatus ? <span className="badge bg-success">Active</span> : <span className="badge bg-secondary">Inactive</span>}
                </label>
              </div>
            </div>
          </div>
        </div>



        {/* Actions */}
        {!isFormValid && (
          <div className="alert alert-danger py-2 px-3 small mb-2 d-flex align-items-center gap-2" style={{ borderRadius: 'var(--ip-radius-md)' }}>
            <i className="bi bi-exclamation-triangle-fill fs-6 flex-shrink-0" />
            <div>
              <strong>Form Incomplete:</strong> Please complete all required fields correctly to enable the Save Changes button.
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
            onClick={() => navigate(`/admin/plans/${id}`)}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="btn px-5"
            style={{
              borderRadius: 'var(--ip-radius-pill)',
              fontWeight: 700,
              backgroundColor: !isFormValid ? 'var(--ip-border)' : 'var(--ip-brand)',
              color: '#fff',
              boxShadow: 'var(--ip-shadow-sm)',
              cursor: !isFormValid ? 'not-allowed' : 'pointer',
              opacity: !isFormValid ? 0.65 : 1,
            }}
            onClick={handleSubmit}
            disabled={submitting || !isFormValid}
          >
            {submitting ? (
              <><span className="spinner-border spinner-border-sm me-2" /> Saving...</>
            ) : (
              <><i className="bi bi-check-lg me-2" /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPlanPage;
