import React, { useState, useEffect, useMemo } from 'react';
import FormGuidelines from '../ui/FormGuidelines';

const STANDARD_AMOUNTS = [
  { value: '50000', label: '₹50,000' },
  { value: '100000', label: '₹1,00,000 (1 Lakh)' },
  { value: '200000', label: '₹2,00,000 (2 Lakhs)' },
  { value: '300000', label: '₹3,00,000 (3 Lakhs)' },
  { value: '500000', label: '₹5,00,000 (5 Lakhs)' },
  { value: '1000000', label: '₹10,00,000 (10 Lakhs)' },
  { value: '2000000', label: '₹20,00,000 (20 Lakhs)' },
  { value: '5000000', label: '₹50,00,000 (50 Lakhs)' },
  { value: '10000000', label: '₹1,00,00,000 (1 Crore)' },
  { value: 'custom', label: 'Custom Amount...' }
];

/**
 * CoverageOptionModal
 *
 * Props:
 *   isOpen         {boolean}   Show/hide the modal
 *   mode           {string}    'add' | 'edit'
 *   initialData    {object}    Pre-populated values for edit mode
 *   existingOptions {array}    All current options (for uniqueness validation)
 *   onSave         {fn}        Called with payload on save
 *   onClose        {fn}        Called on cancel / close
 */
const CoverageOptionModal = ({
  isOpen,
  mode = 'add',
  initialData = null,
  existingOptions = [],
  onSave,
  onClose,
}) => {
  const [coverageAmount, setCoverageAmount] = useState('');
  const [label, setLabel] = useState('');
  const [displayOrder, setDisplayOrder] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isCustomAmount, setIsCustomAmount] = useState(false);

  /* Populate form on open/mode change */
  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initialData) {
      const initialAmt = String(initialData.coverageAmount || '');
      setCoverageAmount(initialAmt);
      setLabel(initialData.label || '');
      setDisplayOrder(String(initialData.displayOrder || ''));
      setIsActive(initialData.isActive ?? initialData.active ?? true);

      // Check if amount is custom
      const standardVals = STANDARD_AMOUNTS.map(opt => opt.value);
      if (initialAmt && !standardVals.includes(initialAmt)) {
        setIsCustomAmount(true);
      } else {
        setIsCustomAmount(false);
      }
    } else {
      setCoverageAmount('');
      setLabel('');
      setDisplayOrder('');
      setIsActive(true);
      setIsCustomAmount(false);
    }
    setErrors({});
    setSaving(false);
  }, [isOpen, mode, initialData]);

  /* Auto-suggest label from amount */
  const handleAmountChange = (val) => {
    setCoverageAmount(val);
    if (!label || label.startsWith('₹')) {
      const num = Number(val);
      if (num > 0) {
        if (num >= 10000000) {
          setLabel(`₹${(num / 10000000).toLocaleString('en-IN')} Crore${num === 10000000 ? '' : 's'}`);
        } else if (num >= 100000) {
          setLabel(`₹${(num / 100000).toLocaleString('en-IN')} Lakhs`);
        } else {
          setLabel(`₹${num.toLocaleString('en-IN')}`);
        }
      } else {
        setLabel('');
      }
    }
  };

  const validate = () => {
    const errs = {};
    const amt = Number(coverageAmount);
    const order = Number(displayOrder);
    const editingId = mode === 'edit' ? (initialData?.id || initialData?.coverageOptionId) : null;

    if (!coverageAmount || isNaN(amt) || amt < 50000) {
      errs.coverageAmount = 'Coverage amount must be at least ₹50,000.';
    } else if (amt > 50000000) {
      errs.coverageAmount = 'Coverage amount cannot exceed ₹5,00,00,000.';
    } else {
      if (amt % 50000 !== 0) {
        errs.coverageAmount = 'Coverage amount must be a multiple of ₹50,000.';
      }

      /* Uniqueness & Ordering: ignore self when editing */
      const otherOptions = existingOptions.filter(o => (o.id || o.coverageOptionId) !== editingId);
      
      if (!errs.coverageAmount) {
        const duplicate = otherOptions.find(o => Number(o.coverageAmount) === amt);
        if (duplicate) {
          errs.coverageAmount = 'This coverage amount already exists in the plan.';
        } else if (mode === 'add' && otherOptions.length > 0) {
          const maxExisting = Math.max(...otherOptions.map(o => Number(o.coverageAmount)));
          if (amt < maxExisting) {
            errs.coverageAmount = `Amount must be greater than the previous maximum (₹${maxExisting.toLocaleString('en-IN')}).`;
          }
        }
      }
    }

    if (label.length > 50) {
      errs.label = 'Label must be 50 characters or less.';
    }

    if (displayOrder === '' || isNaN(order) || !Number.isInteger(order) || order < 1) {
      errs.displayOrder = 'Display order must be a positive integer.';
    } else {
      const duplicate = existingOptions.find(
        (o) =>
          o.displayOrder === order &&
          (o.id || o.coverageOptionId) !== editingId
      );
      if (duplicate) errs.displayOrder = `Display order ${order} is already used.`;
    }

    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await onSave({
        coverageAmount: Number(coverageAmount),
        label: label.trim() || `₹${Number(coverageAmount).toLocaleString('en-IN')}`,
        displayOrder: Number(displayOrder),
        activeStatus: isActive,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

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
    marginBottom: '0.3rem',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1040 }}
        onClick={onClose}
      />
      {/* Modal */}
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div
            className="modal-content border-0"
            style={{
              borderRadius: 'var(--ip-radius-lg)',
              boxShadow: 'var(--ip-shadow-xl)',
              backgroundColor: 'var(--ip-surface)',
            }}
          >
            {/* Header */}
            <div className="modal-header border-0 pb-0 pt-4 px-4">
              <div>
                <h5 className="modal-title fw-bold mb-0" style={{ color: 'var(--ip-text-primary)' }}>
                  <i
                    className={`bi ${mode === 'add' ? 'bi-plus-circle' : 'bi-pencil-square'} me-2`}
                    style={{ color: 'var(--ip-brand)' }}
                  />
                  {mode === 'add' ? 'Add Coverage Option' : 'Edit Coverage Option'}
                </h5>
                <small className="text-muted" style={{ fontSize: '0.78rem' }}>
                  {mode === 'add'
                    ? 'Create a new coverage tier for this plan.'
                    : 'Update this coverage tier.'}
                </small>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              />
            </div>

            {/* Body */}
            <div className="modal-body p-4 pt-3">
              <FormGuidelines
                title="Coverage Rules"
                rules={[
                  "Coverage amounts must be in multiples of ₹50,000.",
                  mode === 'add' ? "New amounts must be strictly greater than the current maximum amount." : "Amounts must be strictly greater than the maximum of all other coverage options.",
                  "Display order determines the sorting sequence on the pricing table."
                ]}
                defaultExpanded={false}
              />
              <div className="d-flex flex-column gap-3">
                {/* Coverage Amount */}
                <div>
                  <label style={labelStyle}>
                    Coverage Amount (₹) <span className="text-danger">*</span>
                  </label>
                  {!isCustomAmount ? (
                    <select
                      className={`form-select ${errors.coverageAmount ? 'is-invalid' : ''}`}
                      style={inputStyle}
                      value={coverageAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'custom') {
                          setIsCustomAmount(true);
                          setCoverageAmount('');
                          setLabel('');
                        } else {
                          handleAmountChange(val);
                        }
                        setErrors((prev) => ({ ...prev, coverageAmount: undefined }));
                      }}
                    >
                      <option value="" disabled>Select an amount</option>
                      {STANDARD_AMOUNTS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="d-flex gap-2">
                      <input
                        type="number"
                        className={`form-control ${errors.coverageAmount ? 'is-invalid' : ''}`}
                        style={inputStyle}
                        value={coverageAmount}
                        onChange={(e) => {
                          handleAmountChange(e.target.value);
                          setErrors((prev) => ({ ...prev, coverageAmount: undefined }));
                        }}
                        placeholder="e.g. 500000"
                        min="1"
                        step="1"
                        onKeyDown={(e) => {
                          if (e.key === 'e') e.preventDefault();
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-light border"
                        onClick={() => {
                          setIsCustomAmount(false);
                          setCoverageAmount('');
                          setLabel('');
                        }}
                        aria-label="Back to predefined amounts"
                        title="Back to predefined amounts"
                        style={{ borderRadius: 'var(--ip-radius-sm)', transition: 'background-color 0.25s' }}
                      >
                        <i className="bi bi-x-lg" />
                      </button>
                    </div>
                  )}

                  {errors.coverageAmount && (
                    <div className="text-danger small mt-1">
                      <i className="bi bi-exclamation-circle me-1" />
                      {errors.coverageAmount}
                    </div>
                  )}
                  {isCustomAmount && coverageAmount && Number(coverageAmount) > 0 && !errors.coverageAmount && (
                    <div className="mt-1 small text-muted">
                      ≈ <strong style={{ color: 'var(--ip-brand)' }}>
                        ₹{Number(coverageAmount).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Label */}
                <div>
                  <label style={labelStyle}>
                    Label{' '}
                    <span className="text-muted fw-normal">(optional, max 50 chars)</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.label ? 'is-invalid' : ''}`}
                    style={inputStyle}
                    value={label}
                    onChange={(e) => {
                      setLabel(e.target.value);
                      setErrors((prev) => ({ ...prev, label: undefined }));
                    }}
                    placeholder="e.g. Gold Cover"
                    maxLength={50}
                  />
                  {errors.label && (
                    <div className="text-danger small mt-1">
                      <i className="bi bi-exclamation-circle me-1" />
                      {errors.label}
                    </div>
                  )}
                  <div className="text-end small text-muted mt-1">{label.length}/50</div>
                </div>

                {/* Display Order */}
                <div>
                  <label style={labelStyle}>
                    Display Order <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className={`form-control ${errors.displayOrder ? 'is-invalid' : ''}`}
                    style={inputStyle}
                    value={displayOrder}
                    onChange={(e) => {
                      setDisplayOrder(e.target.value);
                      setErrors((prev) => ({ ...prev, displayOrder: undefined }));
                    }}
                    placeholder="e.g. 1"
                    min="1"
                    step="1"
                    onKeyDown={(e) => {
                      if (e.key === '.' || e.key === 'e') e.preventDefault();
                    }}
                  />
                  {errors.displayOrder && (
                    <div className="text-danger small mt-1">
                      <i className="bi bi-exclamation-circle me-1" />
                      {errors.displayOrder}
                    </div>
                  )}
                </div>

                {/* Status — only in edit mode */}
                {mode === 'edit' && (
                  <div>
                    <label style={labelStyle}>Status</label>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          borderRadius: 'var(--ip-radius-pill)',
                          fontWeight: 600,
                          padding: '0.4rem 1rem',
                          border: isActive ? 'none' : '1.5px solid var(--ip-border)',
                          backgroundColor: isActive ? 'var(--ip-success)' : 'transparent',
                          color: isActive ? '#fff' : 'var(--ip-text-muted)',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => setIsActive(true)}
                      >
                        <i className="bi bi-check-circle me-1" />
                        Active
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          borderRadius: 'var(--ip-radius-pill)',
                          fontWeight: 600,
                          padding: '0.4rem 1rem',
                          border: !isActive ? 'none' : '1.5px solid var(--ip-border)',
                          backgroundColor: !isActive ? 'var(--ip-text-muted)' : 'transparent',
                          color: !isActive ? '#fff' : 'var(--ip-text-muted)',
                          transition: 'all 0.2s',
                        }}
                        onClick={() => setIsActive(false)}
                      >
                        <i className="bi bi-x-circle me-1" />
                        Inactive
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn px-4"
                style={{
                  borderRadius: 'var(--ip-radius-pill)',
                  fontWeight: 600,
                  border: '1.5px solid var(--ip-border)',
                  color: 'var(--ip-text-secondary)',
                }}
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn px-4"
                style={{
                  borderRadius: 'var(--ip-radius-pill)',
                  fontWeight: 700,
                  backgroundColor: 'var(--ip-brand)',
                  color: '#fff',
                  boxShadow: 'var(--ip-shadow-sm)',
                }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-1" />
                    {mode === 'add' ? 'Add Coverage' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CoverageOptionModal;
