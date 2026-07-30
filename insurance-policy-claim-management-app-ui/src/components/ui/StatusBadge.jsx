const toTitleCase = (str) => {
  if (!str) return "";
  return str.toLowerCase().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const STATUS_CONFIG = {
  ACTIVE: {
    bg: 'var(--ip-policy-active-bg, #f0fdf4)',
    color: 'var(--ip-policy-active, #16a34a)',
    border: 'var(--ip-success-subtle, #bbf7d0)',
    icon: "bi-check-circle-fill"
  },
  APPROVED: {
    bg: 'var(--ip-claim-approved-bg, #f0fdf4)',
    color: 'var(--ip-claim-approved, #16a34a)',
    border: 'var(--ip-success-subtle, #bbf7d0)',
    icon: "bi-check-circle-fill"
  },
  SUCCESS: {
    bg: 'var(--ip-success-bg, #ecfdf5)',
    color: 'var(--ip-success, #059669)',
    border: 'var(--ip-success-subtle, #a7f3d0)',
    icon: "bi-check-circle-fill"
  },
  ASSIGNED: {
    bg: 'var(--ip-info-bg, #eff6ff)',
    color: 'var(--ip-info, #2563eb)',
    border: 'var(--ip-info-subtle, #bfdbfe)',
    icon: "bi-person-check-fill"
  },
  PENDING: {
    bg: 'var(--ip-warning-bg, #fffbeb)',
    color: 'var(--ip-warning, #d97706)',
    border: 'var(--ip-warning-subtle, #fde047)',
    icon: "bi-clock-fill"
  },
  UNDER_REVIEW: {
    bg: 'var(--ip-claim-under-review-bg, #fffbeb)',
    color: 'var(--ip-claim-under-review, #f59e0b)',
    border: 'var(--ip-warning-subtle, #fef08a)',
    icon: "bi-search"
  },
  SUBMITTED: {
    bg: 'var(--ip-claim-submitted-bg, #eff6ff)',
    color: 'var(--ip-claim-submitted, #3b82f6)',
    border: 'var(--ip-info-subtle, #dbeafe)',
    icon: "bi-file-earmark-check-fill"
  },
  PENDING_PAYMENT: {
    bg: 'var(--ip-policy-pending-bg, #fffbeb)',
    color: 'var(--ip-policy-pending, #f59e0b)',
    border: 'var(--ip-warning-subtle, #fed7aa)',
    icon: "bi-credit-card-fill"
  },
  REJECTED: {
    bg: 'var(--ip-claim-rejected-bg, #fef2f2)',
    color: 'var(--ip-claim-rejected, #dc2626)',
    border: 'var(--ip-danger-subtle, #fecaca)',
    icon: "bi-x-circle-fill"
  },
  CANCELLED: {
    bg: 'var(--ip-policy-cancelled-bg, #fef2f2)',
    color: 'var(--ip-policy-cancelled, #dc2626)',
    border: 'var(--ip-danger-subtle, #fecdd3)',
    icon: "bi-slash-circle-fill"
  },
  EXPIRED: {
    bg: 'var(--ip-policy-expired-bg, #f1f5f9)',
    color: 'var(--ip-policy-expired, #64748b)',
    border: 'var(--ip-secondary-subtle, #e5e7eb)',
    icon: "bi-hourglass-bottom"
  },
  FAILED: {
    bg: 'var(--ip-danger-bg, #fef2f2)',
    color: 'var(--ip-danger, #dc2626)',
    border: 'var(--ip-danger-subtle, #fbcfe8)',
    icon: "bi-exclamation-triangle-fill"
  },
  RECOMMENDED_FOR_APPROVAL: {
    bg: 'var(--ip-claim-rec-approval-bg, #ecfdf5)',
    color: 'var(--ip-claim-rec-approval, #10b981)',
    border: 'var(--ip-success-subtle, #c7d2fe)',
    icon: "bi-hand-thumbs-up-fill",
    label: "Recommended for Approval"
  },
  RECOMMENDED_FOR_REJECTION: {
    bg: 'var(--ip-claim-rec-rejection-bg, #fff7ed)',
    color: 'var(--ip-claim-rec-rejection, #f97316)',
    border: 'var(--ip-warning-subtle, #f5d0fe)',
    icon: "bi-hand-thumbs-down-fill",
    label: "Recommended for Rejection"
  },
  DEFAULT: {
    bg: 'var(--ip-surface-raised, #f1f5f9)',
    color: 'var(--ip-text-secondary, #475569)',
    border: 'var(--ip-border, #e2e8f0)',
    icon: "bi-info-circle-fill"
  }
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DEFAULT;

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0.35em 0.85em',
    borderRadius: 'var(--ip-radius-pill)',
    fontWeight: '600',
    letterSpacing: '0.02em',
    fontSize: '0.75rem',
    backgroundColor: config.bg,
    color: config.color,
    border: `1px solid ${config.border}`
  };

  const iconClass = config.icon;
  const label = config.label || status;

  return (
    <span style={badgeStyle}>
      {iconClass && <i className={`bi ${iconClass}`} style={{ fontSize: '0.8rem' }}></i>}
      {toTitleCase(label)}
    </span>
  );
};

export default StatusBadge;
