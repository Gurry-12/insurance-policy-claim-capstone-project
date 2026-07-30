import React, { useState } from 'react';
import { configureCoverageOptions, updateCoverageOption } from '../../services/coverageOptionService';
import { notify } from '../../utils/notificationService';
import ErrorAlert from '../ui/ErrorAlert';

const CoverageOptionsManager = ({ planId, existingOptions = [], onUpdate }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [coverageAmount, setCoverageAmount] = useState('');
  const [label, setLabel] = useState('');
  const [displayOrder, setDisplayOrder] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  // Calculate min and max allowed scope for this plan based on existing options
  const minScope = React.useMemo(() => {
    if (!existingOptions || existingOptions.length === 0) return 50000;
    return Math.min(...existingOptions.map(o => Number(o.coverageAmount || 0)));
  }, [existingOptions]);

  const maxScope = React.useMemo(() => {
    if (!existingOptions || existingOptions.length === 0) return 50000000;
    return Math.max(...existingOptions.map(o => Number(o.coverageAmount || 0)));
  }, [existingOptions]);

  const availableSlabs = React.useMemo(() => {
    const slabs = [];
    const min = minScope || 50000;
    const max = maxScope || 50000000;
    for (let val = min; val <= max; val += val < 500000 ? 50000 : val < 2500000 ? 100000 : 500000) {
      slabs.push({
        value: val,
        label: `₹${(val / 100000).toLocaleString('en-IN')} Lakhs (${val.toLocaleString('en-IN')})`
      });
    }
    if (!slabs.some(s => s.value === max)) {
      slabs.push({
        value: max,
        label: `₹${(max / 100000).toLocaleString('en-IN')} Lakhs (${max.toLocaleString('en-IN')})`
      });
    }
    return slabs;
  }, [minScope, maxScope]);

  // Inline editing states
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editOrder, setEditOrder] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const isAddValid = React.useMemo(() => {
    return coverageAmount !== '' && label.trim() !== '' && displayOrder !== '' && !isNaN(Number(displayOrder));
  }, [coverageAmount, label, displayOrder]);

  const handleAddCoverage = async (e) => {
    e.preventDefault();
    setError('');
    if (!coverageAmount || !label || !displayOrder) {
      const msg = "Please fill all coverage fields.";
      setError(msg); return notify.error(msg);
    }

    const amt = Number(coverageAmount);
    if (amt < 50000 || amt % 50000 !== 0) {
      const msg = "Coverage amount must be at least ₹50,000 and a multiple of 50,000.";
      setError(msg); return notify.error(msg);
    }
    if (existingOptions && existingOptions.length > 0 && (amt < minScope || amt > maxScope)) {
      const msg = `Coverage amount (₹${(amt / 100000).toLocaleString('en-IN')}L) is out of scope! It must be between ₹${(minScope / 100000).toLocaleString('en-IN')}L and ₹${(maxScope / 100000).toLocaleString('en-IN')}L.`;
      setError(msg); return notify.error(msg);
    }
    if (amt > 50000000) {
      const msg = "Coverage amount cannot exceed ₹5,00,00,000 (5 Crores).";
      setError(msg); return notify.error(msg);
    }
    if (existingOptions.length >= 30) {
      const msg = "Cannot exceed 30 coverage tiers per plan.";
      setError(msg); return notify.error(msg);
    }

    setIsAdding(true);
    try {
      const payload = {
        coverageAmount: Number(coverageAmount),
        label: label,
        displayOrder: Number(displayOrder),
        activeStatus: true
      };
      
      const res = await configureCoverageOptions(planId, payload);
      notify.success("Coverage option added successfully.");
      if (onUpdate) onUpdate();
      
      setCoverageAmount('');
      setLabel('');
      setDisplayOrder('');
      setShowAddForm(false);
    } catch (error) {
      const msg = error.message || "Failed to add coverage option.";
      setError(msg);
      notify.error(msg);
    } finally {
      setIsAdding(false);
    }
  };

  const startEdit = (opt) => {
    setError('');
    const id = opt.id || opt.coverageOptionId;
    setEditingId(id);
    setEditAmount(opt.coverageAmount || '');
    setEditLabel(opt.label || '');
    setEditOrder(opt.displayOrder || '');
    setEditActive(opt.isActive ?? opt.active ?? true);
  };

  const cancelEdit = () => {
    setError('');
    setEditingId(null);
  };

  const handleSaveEdit = async (optId) => {
    setError('');
    if (!editAmount || !editLabel || editOrder === '') {
      const msg = "Please fill all coverage edit fields.";
      setError(msg);
      return notify.error(msg);
    }
    const amt = Number(editAmount);
    if (amt < 50000 || amt % 50000 !== 0) {
      const msg = "Coverage amount must be at least ₹50,000 and a multiple of 50,000.";
      setError(msg);
      return notify.error(msg);
    }
    if (existingOptions && existingOptions.length > 0 && (amt < minScope || amt > maxScope)) {
      const msg = `Coverage amount (₹${(amt / 100000).toLocaleString('en-IN')}L) is out of scope! It must be between ₹${(minScope / 100000).toLocaleString('en-IN')}L and ₹${(maxScope / 100000).toLocaleString('en-IN')}L.`;
      setError(msg);
      return notify.error(msg);
    }
    if (amt > 50000000) {
      const msg = "Coverage amount cannot exceed ₹5,00,00,000 (5 Crores).";
      setError(msg);
      return notify.error(msg);
    }

    setIsUpdating(true);
    try {
      const payload = {
        coverageAmount: amt,
        label: editLabel,
        displayOrder: Number(editOrder),
        activeStatus: editActive
      };
      await updateCoverageOption(planId, optId, payload);
      notify.success("Coverage tier updated successfully.");
      setEditingId(null);
      if (onUpdate) onUpdate();
    } catch (error) {
      const msg = error.message || "Failed to update coverage tier.";
      setError(msg);
      notify.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleCoverage = async (opt) => {
    setError('');
    if (!opt.id && !opt.coverageOptionId) {
      const msg = "Cannot edit this option, ID missing.";
      setError(msg);
      notify.error(msg);
      return;
    }
    const optionId = opt.id || opt.coverageOptionId;
    try {
      const payload = {
        coverageAmount: opt.coverageAmount,
        label: opt.label || `₹${((opt.coverageAmount || 0) / 100000).toLocaleString('en-IN')} Lakhs`,
        displayOrder: opt.displayOrder || 1,
        activeStatus: !(opt.isActive ?? opt.active ?? true)
      };
      await updateCoverageOption(planId, optionId, payload);
      notify.success(`Coverage tier ${payload.activeStatus ? 'activated' : 'disabled'} successfully.`);
      if (onUpdate) onUpdate();
    } catch (error) {
      const msg = error.message || "Failed to update coverage option.";
      setError(msg);
      notify.error(msg);
    }
  };

  return (
    <div className="card border-0 mb-4" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h6 className="fw-bold m-0">Coverage Configuration</h6>
          <button 
            className="btn btn-outline-primary btn-sm rounded-pill px-3" 
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : '+ Add Custom Tier'}
          </button>
        </div>

        {error && (
          <div className="mb-3">
            <ErrorAlert message={error} onClose={() => setError('')} />
          </div>
        )}

        {showAddForm && (
          <div className="p-3 bg-light rounded-3 border mb-4 fade-in">
            <h6 className="fw-semibold mb-3 fs-6">Add Custom Coverage Tier</h6>
            <form onSubmit={handleAddCoverage} className="row g-2 align-items-end">
              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">Coverage Amount (₹)</label>
                <select
                  className="form-select form-select-sm"
                  value={coverageAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCoverageAmount(val);
                    if (val && !label) {
                      setLabel(`₹${(Number(val) / 100000).toLocaleString('en-IN')} Lakhs`);
                    }
                  }}
                >
                  <option value="">Select within scope...</option>
                  {availableSlabs.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">Label</label>
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. ?5 Lakhs"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">Display Order</label>
                <input 
                  type="number" 
                  step="1"
                  className="form-control form-control-sm" 
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  placeholder="e.g. 1"
                  onKeyDown={(e) => { if (e.key === '.' || e.key === 'e') e.preventDefault(); }}
                />
              </div>
              <div className="col-md-3">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm w-100"
                  style={{
                    cursor: !isAddValid ? 'not-allowed' : 'pointer',
                    opacity: !isAddValid ? 0.65 : 1,
                  }}
                  disabled={isAdding || !isAddValid}
                >
                  {isAdding ? "Adding..." : "Add Coverage"}
                </button>
              </div>
              {!isAddValid && (
                <div className="col-12 mt-1">
                  <div className="text-danger small">
                    <i className="bi bi-exclamation-circle me-1" />
                    Please fill amount, label, and order to add coverage tier.
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        {existingOptions && existingOptions.length > 0 ? (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Order</th>
                  <th>Coverage</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {existingOptions
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((opt, idx) => {
                    const isActive = opt.isActive ?? opt.active;
                    const optId = opt.id || opt.coverageOptionId;
                    const isEditingThis = optId === editingId;

                    if (isEditingThis) {
                      return (
                        <tr key={idx} className="table-active">
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              style={{ width: '70px' }}
                              value={editOrder}
                              onChange={(e) => setEditOrder(e.target.value)}
                            />
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <select
                                className="form-select form-select-sm"
                                value={editAmount}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditAmount(val);
                                  if (val && !editLabel) {
                                    setEditLabel(`₹${(Number(val) / 100000).toLocaleString('en-IN')} Lakhs`);
                                  }
                                }}
                              >
                                <option value="">Select within scope...</option>
                                {availableSlabs.map((s) => (
                                  <option key={s.value} value={s.value}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Label (e.g. ₹5 Lakhs)"
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                              />
                            </div>
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={editActive}
                              onChange={(e) => setEditActive(e.target.value === 'true')}
                            >
                              <option value="true">Active</option>
                              <option value="false">Retired</option>
                            </select>
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-1">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleSaveEdit(optId)}
                                disabled={isUpdating}
                              >
                                {isUpdating ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={cancelEdit}
                                disabled={isUpdating}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={idx}>
                        <td><span className="text-muted">#{opt.displayOrder}</span></td>
                        <td>
                          <span className="fw-semibold">
                            {opt.label || `₹${((opt.coverageAmount || opt) / 100000).toLocaleString('en-IN')} Lakhs`}
                          </span>
                        </td>
                        <td>
                          {isActive ? (
                            <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3">
                              <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.4rem', verticalAlign: 'middle' }}></i> Active
                            </span>
                          ) : (
                            <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3">
                              <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.4rem', verticalAlign: 'middle' }}></i> Retired
                            </span>
                          )}
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => startEdit(opt)}
                          >
                            Edit
                          </button>
                          <button 
                            className={`btn btn-sm ${isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                            style={{ width: '80px' }}
                            onClick={() => handleToggleCoverage(opt)}
                          >
                            {isActive ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-4 bg-light rounded-3 text-muted">
            <i className="bi bi-shield-x fs-2 d-block mb-2"></i>
            No coverage options found.
          </div>
        )}
      </div>
    </div>
  );
};

export default CoverageOptionsManager;
