/**
 * FilterChips - Displays active filters as individually-removable chips
 *
 * Props:
 *   fields       - same field config array passed to FilterPanel
 *   localFilters - current applied filter values
 *   onRemove     - called with { [name]: '' } to clear a specific filter key
 *   onClearAll   - called to reset all filters
 */

const formatAmount = (val) =>
  val ? `₹${Number(val).toLocaleString("en-IN")}` : "";

const FilterChips = ({ fields = [], localFilters, onRemove, onClearAll }) => {
  const chips = [];

  fields.forEach((field) => {
    if (field.type === "text") {
      const val = localFilters[field.name];
      if (val) {
        chips.push({
          key: field.name,
          label: `${field.label}: "${val}"`,
          onRemove: () => onRemove({ [field.name]: "" }),
        });
      }
    }

    if (field.type === "select") {
      const val = localFilters[field.name];
      if (val) {
        const opt = field.options?.find((o) => o.value === val);
        chips.push({
          key: field.name,
          label: `${field.label}: ${opt?.label || val}`,
          onRemove: () => onRemove({ [field.name]: "" }),
        });
      }
    }

    if (field.type === "amount-range") {
      const mn = localFilters[field.minName];
      const mx = localFilters[field.maxName];
      if (mn && mx) {
        chips.push({
          key: `${field.minName}-${field.maxName}`,
          label: `${field.label}: ${formatAmount(mn)} – ${formatAmount(mx)}`,
          onRemove: () =>
            onRemove({ [field.minName]: "", [field.maxName]: "" }),
        });
      }
    }
  });

  if (chips.length === 0) return null;

  return (
    <div
      className="ip-filter-chips-bar"
      role="status"
      aria-label="Active filters"
    >
      <span className="ip-filter-chips-label">Active:</span>
      {chips.map((chip) => (
        <span key={chip.key} className="ip-filter-chip">
          <span className="ip-filter-chip-text">{chip.label}</span>
          <button
            className="ip-filter-chip-remove"
            onClick={chip.onRemove}
            aria-label={`Remove filter: ${chip.label}`}
            type="button"
          >
            <i className="bi bi-x" />
          </button>
        </span>
      ))}
      <button
        className="ip-filter-chips-clear-all"
        onClick={onClearAll}
        type="button"
        aria-label="Clear all filters"
      >
        <i className="bi bi-x-circle me-1" />
        Clear All
      </button>
    </div>
  );
};

export default FilterChips;
