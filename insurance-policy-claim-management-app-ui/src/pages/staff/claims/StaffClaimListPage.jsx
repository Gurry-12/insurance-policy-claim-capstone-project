import { useEffect, useState } from "react";
import { getAllClaimsPaginated } from "../../../services/claimService";
import { useNavigate, Outlet } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import ExportButton from "../../../components/common/ExportButton";
import useTableState from "../../../hooks/useTableState";
import PaginationBar from "../../../components/tables/PaginationBar";
import DataTable from "../../../components/tables/DataTable";
import FilterPanel from "../../../components/ui/FilterPanel";
import FilterChips from "../../../components/ui/FilterChips";
import SortableHeader from "../../../components/tables/SortableHeader";
import useDebounceFilters from "../../../hooks/useDebounceFilters";
import { CLAIM_STATUS_OPTIONS } from "../../../utils/options";

const FILTER_FIELDS = [
  {
    type: "select",
    name: "status",
    label: "Claim Status",
    options: CLAIM_STATUS_OPTIONS,
  },
  { type: 'amount-range', minName: 'minClaimAmount', maxName: 'maxClaimAmount', label: 'Claim Amount' },
];

const StaffClaimListPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const tableState = useTableState({
    initialSortBy: "createdDate",
    initialSortDirection: "desc",
    initialFilters: { status: '', minClaimAmount: '', maxClaimAmount: '' }
  });

  const { localFilters, clearFilters } = useDebounceFilters(
    tableState.filters,
    tableState.handleFilterChange
  );

  const { getQueryParams, setTotalPages, setTotalElements } = tableState;

  useEffect(() => {
    const loadClaims = async () => {
      try {
        setLoading(true);
        const params = getQueryParams();
        const data = await getAllClaimsPaginated(params);
        setClaims(data.content || []);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalRecords || data.totalElements || 0);
      } catch (error) {
        console.error("Error loading claims:", error);
      } finally {
        setLoading(false);
      }
    };

    loadClaims();
  }, [getQueryParams, setTotalPages, setTotalElements]);

  const renderHeader = (label, field) => (
    <SortableHeader 
      label={label} 
      field={field} 
      currentSortBy={tableState.sortBy} 
      currentDirection={tableState.sortDirection} 
      onSort={tableState.handleSort} 
    />
  );

  const columns = [
    { 
      header: "Sr. No.",
      cell: (row, index) => tableState.getSrNo(index), 
      minWidth: "85px" 
    },
    { header: renderHeader("Claim Number", "claimNumber"), cell: (row) => <span className="fw-semibold">{row.claimNumber}</span> },
    { header: "Customer Name", accessor: "customerName", cell: (row) => <span className="fw-semibold">{row.customerName}</span> },
    { header: renderHeader("Policy Number", "policyNumber"), accessor: "policyNumber" },
    {
      header: renderHeader("Amount (₹)", "claimAmount"),
      cell: (row) => <span className="fw-semibold">₹{row.claimAmount?.toLocaleString("en-IN") || 0}</span>,
    },
    {
      header: renderHeader("Status", "claimStatus"),
      cell: (row) => <StatusBadge status={row.claimStatus} />,
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-light text-primary border-0"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/staff/claims/${row.claimId}`);
            }}
            title="View Details"
          >
            <i className="bi bi-eye" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Claim Management"
        subtitle="Track your client claims"
        action={
          <div className="d-flex gap-2">
            <ExportButton
              fetchAll={async () => {
                const res = await getAllClaimsPaginated({...tableState.getQueryParams(),  pageSize: tableState.totalElements || 1000, pageNumber: 0 });
                return res.content || [];
              }}
              columns={[
                { header: "Claim Number", accessor: "claimNumber" },
                { header: "Customer Name", accessor: "customerName" },
                { header: "Policy Number", accessor: "policyNumber" },
                { header: "Claim Amount (₹)", accessor: "claimAmount" },
                { header: "Status", accessor: "claimStatus" },
              ]}
              filename="Staff_claims_list.csv"
            />
            <button
              className="btn btn-secondary d-inline-flex align-items-center gap-1"
              onClick={() => navigate("/staff/dashboard")}
            >
              <i className="bi bi-arrow-left"></i> Back
            </button>
          </div>
        }
      />

      <div className="card border-0" style={{ borderRadius: 16, boxShadow: "var(--ip-shadow-md)" }}>
        <div className="card-body p-0">
          <div className="p-4 border-bottom border-light">
            <div className="ip-table-toolbar">
              <div className="ip-table-toolbar-left">
                <h6 className="ip-table-title">All Claims</h6>
                {tableState.totalElements > 0 && (
                  <span className="ip-total-badge">{tableState.totalElements} total</span>
                )}
              </div>
              <FilterPanel
                fields={FILTER_FIELDS}
                localFilters={localFilters}
                onApply={(draft) => tableState.handleFilterChange(draft)}
                onClear={clearFilters}
              />
            </div>
            <FilterChips
              fields={FILTER_FIELDS}
              localFilters={localFilters}
              onRemove={(updates) => tableState.handleFilterChange(updates)}
              onClearAll={clearFilters}
            />
          </div>
          <div className="p-4">
            <DataTable
              columns={columns}
              data={claims}
              loading={loading}
              onRowClick={(row) => navigate(`/staff/claims/${row.claimId}`)}
            />
            <PaginationBar
              currentPage={tableState.currentPage}
              totalPages={tableState.totalPages}
              onPageChange={tableState.setCurrentPage}
            />
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
};

export default StaffClaimListPage;
