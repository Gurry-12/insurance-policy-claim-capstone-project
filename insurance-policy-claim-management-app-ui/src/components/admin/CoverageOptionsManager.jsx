import React, { useState } from 'react';
import CoverageOptionCard from '../common/CoverageOptionCard';
import CoverageOptionModal from '../modals/CoverageOptionModal';
import ConfirmModal from '../modals/ConfirmModal';
import ErrorAlert from '../ui/ErrorAlert';
import {
  configureCoverageOptions,
  updateCoverageOption,
  deleteCoverageOption,
} from '../../services/coverageOptionService';
import { notify } from '../../utils/notificationService';

const sectionHeader = {
  fontSize: '0.8rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--ip-text-muted)',
};

/**
 * CoverageOptionsManager
 *
 * Displays coverage options for a plan as visual cards.
 * Supports Add (modal), Edit (modal), and Delete (confirm dialog).
 *
 * Props:
 *   planId           {string|number}  The plan's ID
 *   existingOptions  {array}          Coverage options from plan data
 *   onUpdate         {fn}             Called after any successful mutation
 */
const CoverageOptionsManager = ({ planId, existingOptions = [], onUpdate }) => {
  const [error, setError] = useState('');

  /* ── modal state ── */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingOption, setEditingOption] = useState(null);

  /* ── delete state ── */
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingOption, setDeletingOption] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ── sorted options ── */
  const sorted = [...existingOptions].sort((a, b) => a.displayOrder - b.displayOrder);

  /* ── Add ── */
  const openAdd = () => {
    setEditingOption(null);
    setModalMode('add');
    setModalOpen(true);
    setError('');
  };

  /* ── Edit ── */
  const openEdit = (option) => {
    setEditingOption(option);
    setModalMode('edit');
    setModalOpen(true);
    setError('');
  };

  /* ── Delete ── */
  const openDelete = (option) => {
    setDeletingOption(option);
    setDeleteModalOpen(true);
    setError('');
  };

  /* ── Save (Add or Edit) ── */
  const handleSave = async (payload) => {
    setError('');
    try {
      if (modalMode === 'add') {
        await configureCoverageOptions(planId, payload);
        notify.success('Coverage option added successfully.');
      } else {
        const optId = editingOption?.id || editingOption?.coverageOptionId;
        await updateCoverageOption(planId, optId, payload);
        notify.success('Coverage option updated successfully.');
      }
      setModalOpen(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      const msg = err.message || 'Failed to save coverage option.';
      setError(msg);
      notify.error(msg);
      throw err; // re-throw so modal keeps spinner in place on fail
    }
  };

  /* ── Confirm delete ── */
  const handleConfirmDelete = async () => {
    if (!deletingOption) return;
    const optId = deletingOption.id || deletingOption.coverageOptionId;
    setIsDeleting(true);
    setDeleteModalOpen(false);
    try {
      await deleteCoverageOption(planId, optId);
      notify.success('Coverage option deleted.');
      if (onUpdate) onUpdate();
    } catch (err) {
      const msg = err.message || 'Failed to delete coverage option.';
      setError(msg);
      notify.error(msg);
    } finally {
      setIsDeleting(false);
      setDeletingOption(null);
    }
  };

  return (
    <>
      <div
        className="card border-0 mb-4"
        style={{ borderRadius: 'var(--ip-radius-lg)', boxShadow: 'var(--ip-shadow-md)' }}
      >
        <div className="card-body p-4">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <div style={sectionHeader}>
                <i className="bi bi-shield-check me-2" style={{ color: 'var(--ip-brand)' }} />
                Coverage Options
              </div>
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                {sorted.length} tier{sorted.length !== 1 ? 's' : ''} configured
                {sorted.length > 0 && (
                  <> &nbsp;·&nbsp; sorted by display order</>
                )}
              </small>
            </div>
            <button
              className="btn btn-sm"
              style={{
                borderRadius: 'var(--ip-radius-pill)',
                border: '1.5px solid var(--ip-brand)',
                color: 'var(--ip-brand)',
                fontWeight: 700,
                fontSize: '0.82rem',
                padding: '0.45rem 1.1rem',
                transition: 'all 0.2s',
              }}
              onClick={openAdd}
              disabled={isDeleting}
            >
              <i className="bi bi-plus-lg me-1" />
              Add Coverage
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-3">
              <ErrorAlert message={error} onClose={() => setError('')} />
            </div>
          )}

          {/* Cards grid */}
          {sorted.length > 0 ? (
            <div className="row g-3">
              {sorted.map((opt) => {
                const optId = opt.id || opt.coverageOptionId;
                return (
                  <div key={optId ?? opt.displayOrder} className="col-sm-6 col-lg-4">
                    <CoverageOptionCard
                      option={opt}
                      mode="admin"
                      onEdit={openEdit}
                      onDelete={openDelete}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="text-center py-5"
              style={{
                borderRadius: 'var(--ip-radius-md)',
                border: '1.5px dashed var(--ip-border)',
                color: 'var(--ip-text-muted)',
              }}
            >
              <i className="bi bi-shield-exclamation mb-2 d-block" style={{ fontSize: '2rem' }} />
              <div className="fw-semibold mb-1">No coverage options yet</div>
              <small>Click "Add Coverage" to configure the first tier.</small>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <CoverageOptionModal
        isOpen={modalOpen}
        mode={modalMode}
        initialData={editingOption}
        existingOptions={existingOptions}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Coverage Option"
        message={
          deletingOption
            ? `Are you sure you want to delete "${deletingOption.label || '₹' + Number(deletingOption.coverageAmount).toLocaleString('en-IN')}"? This action cannot be undone.`
            : 'Delete this coverage option?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        isDanger
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeletingOption(null);
        }}
      />
    </>
  );
};

export default CoverageOptionsManager;
