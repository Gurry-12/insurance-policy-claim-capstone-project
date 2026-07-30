

const SortableHeader = ({ label, field, currentSortBy, currentDirection, onSort }) => {
  const isSorted = currentSortBy === field;
  return (
    <div 
      className="d-flex align-items-center gap-1 select-none"
      onClick={() => onSort(field)}
      style={{ cursor: 'pointer' }}
    >
      <span>{label}</span>
      {isSorted ? (
        currentDirection === 'asc' ? (
          <i className="bi bi-arrow-up text-primary"></i>
        ) : (
          <i className="bi bi-arrow-down text-primary"></i>
        )
      ) : (
        <i className="bi bi-arrow-down-up text-muted" style={{ opacity: 0.4 }}></i>
      )}
    </div>
  );
};

export default SortableHeader;
