import React from 'react';

/**
 * Formats a number in Indian currency style.
 * E.g. 500000 → ₹5,00,000
 */
export const formatCoverageINR = (amount) =>
  '₹' + Number(amount).toLocaleString('en-IN');

/**
 * CoverageOptionCard — reusable coverage tier card.
 *
 * Props:
 *   option       {object}   Coverage option object from API
 *   mode         {string}   'select' | 'admin' | 'display'
 *   isSelected   {boolean}  Highlight as selected (select mode)
 *   onSelect     {fn}       Called with option when card is clicked (select mode)
 *   onEdit       {fn}       Called with option when Edit is clicked (admin mode)
 *   onDelete     {fn}       Called with option when Delete is clicked (admin mode)
 *   disabled     {boolean}  Dims the card (inactive options)
 */
const CoverageOptionCard = ({
  option,
  mode = 'display',
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  disabled = false,
}) => {
  const isActive = option.isActive ?? option.active ?? true;
  const isInactive = !isActive || disabled;

  /* ── styles ── */
  const baseCard = {
    borderRadius: 'var(--ip-radius-lg)',
    transition: 'all 0.2s ease',
    cursor: mode === 'select' && !isInactive ? 'pointer' : 'default',
    position: 'relative',
    overflow: 'hidden',
    opacity: isInactive ? 0.58 : 1,
  };

  const selectActive = isSelected && mode === 'select';

  const cardStyle = {
    ...baseCard,
    border: selectActive
      ? '2px solid var(--ip-brand)'
      : '1.5px solid var(--ip-border)',
    backgroundColor: selectActive
      ? 'var(--ip-brand-light)'
      : 'var(--ip-surface)',
    boxShadow: selectActive
      ? '0 0 0 3px rgba(37,99,235,0.12), var(--ip-shadow-md)'
      : 'var(--ip-shadow-sm)',
  };

  /* ── amount display ── */
  const amountStyle = {
    fontSize: mode === 'display' ? '1.1rem' : '1.35rem',
    fontWeight: 800,
    color: selectActive ? 'var(--ip-brand)' : 'var(--ip-text-primary)',
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  };

  const labelStyle = {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--ip-text-muted)',
    marginTop: '0.2rem',
  };

  const handleCardClick = () => {
    if (mode === 'select' && !isInactive && onSelect) {
      onSelect(option);
    }
  };

  /* ── display order badge ── */
  const orderBadge = (
    <span
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: selectActive ? 'var(--ip-brand)' : 'var(--ip-surface-raised)',
        color: selectActive ? '#fff' : 'var(--ip-text-muted)',
        borderRadius: 'var(--ip-radius-pill)',
        fontSize: '0.67rem',
        fontWeight: 700,
        padding: '2px 8px',
        letterSpacing: '0.03em',
      }}
    >
      #{option.displayOrder}
    </span>
  );

  /* ── status badge ── */
  const statusBadge = isActive ? (
    <span
      className="badge"
      style={{
        backgroundColor: 'var(--ip-success-bg)',
        color: 'var(--ip-success)',
        fontSize: '0.68rem',
        fontWeight: 600,
        border: '1px solid var(--ip-success-border)',
        borderRadius: 'var(--ip-radius-pill)',
        padding: '3px 9px',
      }}
    >
      <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.4rem', verticalAlign: 'middle' }} />
      Active
    </span>
  ) : (
    <span
      className="badge"
      style={{
        backgroundColor: 'var(--ip-surface-raised)',
        color: 'var(--ip-text-muted)',
        fontSize: '0.68rem',
        fontWeight: 600,
        border: '1px solid var(--ip-border)',
        borderRadius: 'var(--ip-radius-pill)',
        padding: '3px 9px',
      }}
    >
      <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.4rem', verticalAlign: 'middle' }} />
      Inactive
    </span>
  );

  /* ── SELECT MODE ── */
  if (mode === 'select') {
    return (
      <div
        className="coverage-option-card"
        style={cardStyle}
        onClick={handleCardClick}
        role="button"
        tabIndex={isInactive ? -1 : 0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
        aria-pressed={isSelected}
      >
        <div className="p-3">
          {orderBadge}
          {/* Amount — most prominent */}
          <div style={amountStyle}>{formatCoverageINR(option.coverageAmount)}</div>
          {/* Label */}
          <div style={labelStyle}>{option.label || ''}</div>

          {/* Select indicator */}
          <div className="mt-3 d-flex align-items-center gap-2">
            {selectActive ? (
              <span style={{ color: 'var(--ip-brand)', fontWeight: 700, fontSize: '0.8rem' }}>
                <i className="bi bi-check-circle-fill me-1" />
                Selected
              </span>
            ) : (
              <span style={{ color: 'var(--ip-text-muted)', fontSize: '0.8rem' }}>
                <i className="bi bi-circle me-1" />
                Select
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── ADMIN MODE ── */
  if (mode === 'admin') {
    return (
      <div
        className="coverage-option-card coverage-option-card--admin"
        style={cardStyle}
      >
        <div className="p-3 pb-2">
          {orderBadge}
          {/* Amount — most prominent */}
          <div style={amountStyle} className="pe-4">
            {formatCoverageINR(option.coverageAmount)}
          </div>
          {/* Label */}
          <div style={labelStyle}>{option.label || '—'}</div>

          {/* Status */}
          <div className="mt-2 mb-3">{statusBadge}</div>

          {/* Actions */}
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm flex-grow-1"
              style={{
                borderRadius: 'var(--ip-radius-sm)',
                border: '1.5px solid var(--ip-brand)',
                color: 'var(--ip-brand)',
                fontWeight: 600,
                fontSize: '0.78rem',
                padding: '0.3rem 0.6rem',
              }}
              onClick={() => onEdit && onEdit(option)}
            >
              <i className="bi bi-pencil me-1" />
              Edit
            </button>
            <button
              className="btn btn-sm flex-grow-1"
              style={{
                borderRadius: 'var(--ip-radius-sm)',
                border: '1.5px solid var(--ip-danger)',
                color: 'var(--ip-danger)',
                fontWeight: 600,
                fontSize: '0.78rem',
                padding: '0.3rem 0.6rem',
              }}
              onClick={() => onDelete && onDelete(option)}
            >
              <i className="bi bi-trash me-1" />
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── DISPLAY MODE ── */
  return (
    <div
      className="coverage-option-card"
      style={{
        ...cardStyle,
        cursor: 'default',
      }}
    >
      <div className="p-3">
        {orderBadge}
        <div style={amountStyle} className="pe-4">
          {formatCoverageINR(option.coverageAmount)}
        </div>
        <div style={labelStyle}>{option.label || '—'}</div>
        <div className="mt-2">{statusBadge}</div>
      </div>
    </div>
  );
};

export default CoverageOptionCard;
