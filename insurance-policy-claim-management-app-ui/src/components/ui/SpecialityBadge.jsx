const SPECIALITY_META = {
  HEALTH:    { icon: 'bi-heart-pulse-fill', label: 'Health Specialist' },
  LIFE:      { icon: 'bi-umbrella-fill',    label: 'Life Specialist' },
  MOTOR:     { icon: 'bi-car-front-fill',   label: 'Motor Specialist' },
  TRAVEL:    { icon: 'bi-airplane-fill',    label: 'Travel Specialist' },
  INSURANCE: { icon: 'bi-shield-check-fill', label: 'Insurance Specialist' },
  ALL:       { icon: 'bi-grid-fill',        label: 'Generalist' },
};

const SpecialityBadge = ({ speciality, size = '', className = '' }) => {
  const key = (speciality ?? '').toString().trim().toUpperCase() || 'ALL';
  const meta = SPECIALITY_META[key] || { icon: 'bi-star-fill', label: speciality };
  const tone = SPECIALITY_META[key] ? key : 'ALL';
  const sizeClass = size === 'sm' ? ' ip-speciality-badge-sm' : size === 'lg' ? ' ip-speciality-badge-lg' : '';

  return (
    <span className={`ip-speciality-badge ip-spec-${tone}${sizeClass} ${className}`}>
      <i className={`bi ${meta.icon}`} style={{ fontSize: '0.8rem' }} />
      {meta.label}
    </span>
  );
};

export default SpecialityBadge;
