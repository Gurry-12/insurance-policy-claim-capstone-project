import { useEffect, useRef } from 'react';
import EmptyState from '../ui/EmptyState';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * DataTable
 * ─────────────────────────────────────────────────────────────
 * Loading strategy (Desktop-class Instant Navigation):
 *
 *   Tier 1 — Refresh / Filter (Stale Data):
 *     If we already have rows, keep them rendered but dimmed
 *     to 55% opacity. The layout remains perfectly stable.
 *
 *   Tier 2 — Cold Load (First Visit):
 *     Render the table headers immediately to prevent layout shift.
 *     Render an inline spinner in the center of the body.
 *
 *   Zero Skeleton Screens. Zero full-page loaders.
 */
const DataTable = ({
  columns,
  data,
  loading = false,
  onRowClick,
  emptyIcon    = 'bi-table',
  emptyMessage = 'No data available',
  compact      = false,
}) => {
  // Last successfully-loaded non-empty rows
  const prevDataRef = useRef(null);

  useEffect(() => {
    if (!loading && data && data.length > 0) {
      prevDataRef.current = data;
    }
  }, [loading, data]);

  // While loading, prefer the previous rows
  const staleData = loading ? prevDataRef.current : null;

  // ── First load / hard loading state (inline spinner) ──────
  if (loading && (!staleData || staleData.length === 0)) {
    return (
      <div className="table-responsive" style={compact ? {} : { minHeight: '440px', maxHeight: '600px', overflowY: 'auto' }}>
        <table className={`table align-middle mb-0 ${compact ? 'table-sm' : ''}`} style={compact ? { fontSize: '0.85rem' } : {}}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--ip-surface, #fff)' }}>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="border-0 bg-surface" style={{ minWidth: col.minWidth }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="text-center py-5">
                <LoadingSpinner />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // ── Stale data (fast load — keep previous rows dimmed) ──────
  if (staleData && staleData.length > 0) {
    return (
      <div
        className="table-responsive"
        style={compact ? { opacity: 0.55, transition: 'opacity 150ms ease' } : { minHeight: '440px', maxHeight: '600px', overflowY: 'auto', opacity: 0.55, transition: 'opacity 150ms ease' }}
      >
        <table className={`table table-hover align-middle mb-0 ${compact ? 'table-sm' : ''}`} style={compact ? { fontSize: '0.85rem' } : {}}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--ip-surface, #fff)' }}>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="border-0 bg-surface" style={{ minWidth: col.minWidth }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staleData.map((row, rowIndex) => (
              <tr key={row.id || rowIndex} style={{ cursor: 'default' }} role="row">
                {columns.map((col, colIndex) => (
                  <td key={colIndex}>
                    {col.cell ? col.cell(row, rowIndex) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────
  if (!loading && (!data || data.length === 0)) {
    return (
      <div
        className="d-flex align-items-center justify-content-center py-4"
        style={compact ? { width: '100%' } : { minHeight: '440px', width: '100%' }}
      >
        <EmptyState icon={emptyIcon} message={emptyMessage} />
      </div>
    );
  }

  // ── Real data ───────────────────────────────────────────────
  if (!data || data.length === 0) return null;

  return (
    <div
      className="table-responsive"
      style={compact ? { overflowY: 'auto' } : { minHeight: '440px', maxHeight: '600px', overflowY: 'auto' }}
    >
      <table
        className={`table table-hover align-middle mb-0 ${compact ? 'table-sm' : ''}`}
        style={compact ? { fontSize: '0.85rem' } : {}}
      >
        <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--ip-surface, #fff)' }}>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="border-0 bg-surface" style={{ minWidth: col.minWidth }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          key={data[0]?.id ?? data.length}
          className="dt-data-reveal"
        >
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onRowClick(row);
                }
              }}
              tabIndex={onRowClick ? 0 : undefined}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              role="row"
            >
              {columns.map((col, colIndex) => (
                <td key={colIndex}>
                  {col.cell ? col.cell(row, rowIndex) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
