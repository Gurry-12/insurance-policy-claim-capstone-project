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
    bg: 'var(--ip-payment-success-bg, #f0fdf4)',
    color: 'var(--ip-payment-success, #16a34a)',
    border: 'var(--ip-success-subtle, #bbf7d0)',
    icon: "bi-check-circle-fill"
  },
  ASSIGNED: {
    bg: 'var(--ip-claim-submitted-bg, #f0f9ff)',
    color: 'var(--ip-claim-submitted, #0284c7)',
    border: 'var(--ip-info-subtle, #bae6fd)',
    icon: "bi-person-check-fill"
  },
  PENDING: {
    bg: 'var(--ip-policy-pending-bg, #fffbeb)',
    color: 'var(--ip-policy-pending, #d97706)',
    border: 'var(--ip-warning-subtle, #fde68a)',
    icon: "bi-clock-fill"
  },
  UNDER_REVIEW: {
    bg: 'var(--ip-claim-under-review-bg, #fffbeb)',
    color: 'var(--ip-claim-under-review, #d97706)',
    border: 'var(--ip-warning-subtle, #fde68a)',
    icon: "bi-search"
  },
  SUBMITTED: {
    bg: 'var(--ip-claim-submitted-bg, #f0f9ff)',
    color: 'var(--ip-claim-submitted, #0284c7)',
    border: 'var(--ip-info-subtle, #bae6fd)',
    icon: "bi-file-earmark-check-fill"
  },
  PENDING_PAYMENT: {
    bg: 'var(--ip-policy-pending-bg, #fffbeb)',
    color: 'var(--ip-policy-pending, #d97706)',
    border: 'var(--ip-warning-subtle, #fde68a)',
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
    border: 'var(--ip-danger-subtle, #fecaca)',
    icon: "bi-slash-circle-fill"
  },
  EXPIRED: {
    bg: 'var(--ip-policy-expired-bg, #fffbeb)',
    color: 'var(--ip-policy-expired, #d97706)',
    border: 'var(--ip-warning-subtle, #fde68a)',
    icon: "bi-hourglass-bottom"
  },
  FAILED: {
    bg: 'var(--ip-payment-failed-bg, #fef2f2)',
    color: 'var(--ip-payment-failed, #dc2626)',
    border: 'var(--ip-danger-subtle, #fecaca)',
    icon: "bi-exclamation-triangle-fill"
  },
  INACTIVE: {
    bg: 'var(--ip-surface-raised, #f1f5f9)',
    color: 'var(--ip-text-muted, #64748b)',
    border: 'var(--ip-secondary-subtle, #cbd5e1)',
    icon: "bi-pause-circle-fill"
  },
  RECOMMENDED_FOR_APPROVAL: {
    bg: 'var(--ip-claim-rec-approval-bg, #f0fdf4)',
    color: 'var(--ip-claim-rec-approval, #16a34a)',
    border: 'var(--ip-success-subtle, #bbf7d0)',
    icon: "bi-hand-thumbs-up-fill",
    label: "Recommended for Approval"
  },
  RECOMMENDED_FOR_REJECTION: {
    bg: 'var(--ip-claim-rec-rejection-bg, #fff7ed)',
    color: 'var(--ip-claim-rec-rejection, #ea580c)',
    border: 'var(--ip-warning-subtle, #fed7aa)',
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
  const normalized = (status ?? '').toString().trim().toUpperCase().replace(/ /g, '_');
  const config = STATUS_CONFIG[normalized] || STATUS_CONFIG.DEFAULT;

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
