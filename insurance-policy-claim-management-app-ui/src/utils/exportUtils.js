/**
 * Utility to export tabular data to a downloadable CSV file.
 * 
 * @param {Array} data - Array of objects containing the rows to export
 * @param {Array} columns - Table column configurations (header, accessor, exportValue)
 * @param {string} filename - Output file name
 */
export const exportToCSV = (data, columns, filename = "export.csv") => {
  if (!data || !data.length) return;

  // Collect all unique keys from the DTO dataset that have at least one non-null value
  const allKeys = new Set();
  data.forEach(row => {
    if (row && typeof row === 'object') {
      Object.keys(row).forEach(key => {
        if (row[key] !== null && row[key] !== undefined && row[key] !== "") {
          allKeys.add(key);
        }
      });
    }
  });

  // Filter out any IDs per user request ('id', 'customerId', 'productId', etc.)
  const filteredKeys = Array.from(allKeys).filter(key => 
    key.toLowerCase() !== 'id' && !key.toLowerCase().endsWith('id')
  );

  // Helper to convert camelCase to Title Case
  const toTitleCase = (str) => {
    const result = str.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1).trim();
  };

  // Filter out any existing 'Sr. No.' column from explicitly provided columns
  const explicitColumns = columns.filter(col => col.header !== 'Sr. No.');
  const explicitAccessors = new Set(explicitColumns.map(c => c.accessor).filter(Boolean));
  
  // Add auto-discovered columns that are not already explicitly configured
  const autoColumns = filteredKeys
    .filter(key => !explicitAccessors.has(key))
    .map(key => ({
      header: toTitleCase(key),
      accessor: key,
    }));

  const exportColumns = [...explicitColumns, ...autoColumns];

  const headers = ["Sr. No.", ...exportColumns.map(col => col.header || "")];
  const csvRows = [];

  // Add header row
  csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(","));

  // Add data rows
  data.forEach((row, index) => {
    const values = exportColumns.map(col => {
      let val = "";
      if (col.exportValue) {
        val = col.exportValue(row);
      } else if (col.accessor) {
        const rawVal = row[col.accessor];
        if (rawVal !== undefined && rawVal !== null) {
          val = typeof rawVal === 'object' ? JSON.stringify(rawVal) : rawVal;
        } else {
          val = "";
        }
      }
      let stringVal = String(val);
      // Force Excel/Sheets to treat phone numbers as text by prepending a tab
      // This prevents long numbers or numbers starting with + from being converted to scientific notation
      if (/^\+?\d{10,15}$/.test(stringVal.replace(/\s+/g, ''))) {
        stringVal = `\t${stringVal}`;
      }
      return `"${stringVal.replace(/"/g, '""')}"`;
    });
    
    // Prepend Sr. No. to values
    values.unshift(`"${index + 1}"`);
    
    csvRows.push(values.join(","));
  });

  // Generate blob & download
  const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
