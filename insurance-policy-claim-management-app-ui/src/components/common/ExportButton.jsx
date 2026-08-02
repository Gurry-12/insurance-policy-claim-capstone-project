import { useState } from "react";
import { exportToCSV } from "../../utils/exportUtils";
import { notify } from "../../utils/notificationService";

/**
 * ExportButton - exports ALL data (not just current page).
 *
 * Props:
 *  - data       : current page data (fallback if fetchAll not provided)
 *  - fetchAll   : async () => full array - called on click to get every record
 *  - columns    : [{ header, accessor, exportValue }]
 *  - filename   : output filename
 *  - label      : button label
 */
const ExportButton = ({
  data,
  fetchAll,
  columns,
  filename = "export.csv",
  label = "Export CSV",
}) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      let rows = data || [];

      if (fetchAll) {
        rows = await fetchAll();
      }

      if (!rows || rows.length === 0) {
        notify.error("No data to export.");
        return;
      }

      exportToCSV(rows, columns, filename);
      notify.success(rows.length + " records exported successfully.");
    } catch (error) {
      console.error("Export failed:", error);
      notify.error(error, "Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
      style={{
        borderRadius: "8px",
        padding: "0.4rem 0.8rem",
        fontSize: "0.85rem",
        fontWeight: 500,
        transition: "all 0.25s ease",
        minWidth: "110px",
      }}
    >
      {loading ? (
        <>
          <span className="spinner-border spinner-border-sm" />
          <span>Exporting…</span>
        </>
      ) : (
        <>
          <i className="bi bi-download" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};

export default ExportButton;
