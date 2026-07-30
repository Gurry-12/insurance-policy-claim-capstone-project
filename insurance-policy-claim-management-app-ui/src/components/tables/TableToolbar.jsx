const TableToolbar = ({ title, totalElements, children }) => {
  return (
    <div className="ip-table-toolbar d-flex justify-content-between align-items-center mb-3">
      <div className="ip-table-toolbar-left d-flex align-items-center gap-2">
        <h6 className="ip-table-title mb-0 fw-bold">{title}</h6>
        {totalElements > 0 && (
          <span className="ip-total-badge badge bg-primary bg-opacity-10 text-primary rounded-pill">
            {totalElements} total
          </span>
        )}
      </div>
      <div className="ip-table-toolbar-right d-flex gap-2 align-items-center">
        {children}
      </div>
    </div>
  );
};

export default TableToolbar;
