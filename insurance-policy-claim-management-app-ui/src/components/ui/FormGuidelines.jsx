import React, { useState } from 'react';

/**
 * FormGuidelines
 * 
 * Renders a premium, collapsible info box containing rules or guidelines 
 * to assist users in filling out complex forms.
 * 
 * Props:
 *  - rules: Array of strings representing the rules to display.
 *  - title: Optional custom title (defaults to "Guidelines").
 *  - defaultExpanded: Boolean to determine initial state (defaults to true).
 */
const FormGuidelines = ({ rules = [], title = "Guidelines", defaultExpanded = true }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!rules || rules.length === 0) return null;

  return (
    <div
      className="mb-4 fade-in"
      style={{
        backgroundColor: 'var(--ip-surface-raised, #f8fafc)',
        border: '1px solid var(--ip-brand, #4f46e5)',
        borderRadius: 'var(--ip-radius-md, 8px)',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(79, 70, 229, 0.05)',
      }}
    >
      <div 
        className="d-flex justify-content-between align-items-center p-3"
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="d-flex align-items-center gap-2" style={{ color: 'var(--ip-brand, #4f46e5)' }}>
          <i className="bi bi-info-circle-fill fs-5" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{title}</span>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-link p-0 text-decoration-none"
          style={{ color: 'var(--ip-text-muted, #64748b)' }}
        >
          {isExpanded ? 'Hide' : 'Show'}
        </button>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pt-0 fade-in">
          <ul className="mb-0" style={{ paddingLeft: '1.5rem', color: 'var(--ip-text-secondary, #475569)', fontSize: '0.85rem' }}>
            {rules.map((rule, idx) => (
              <li key={idx} className="mb-1" style={{ lineHeight: '1.5' }}>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FormGuidelines;
