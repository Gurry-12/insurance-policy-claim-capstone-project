import { useEffect, useState } from "react";
import { getAllPoliciesPaginated } from "../../../services/policyService";
import { useNavigate, Link } from "react-router-dom";
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
import { POLICY_STATUS_OPTIONS } from "../../../utils/options";
import { formatINR } from "../../../utils/formatters";

const FILTER_FIELDS = [
  {
    type: "select",
    name: "status",
    label: "Policy Status",
    options: POLICY_STATUS_OPTIONS,
  },
];

const StaffPolicyListPage = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const tableState = useTableState({
    initialSortBy: "id",
    initialFilters: { status: '', startDate: '', endDate: '' }
  });

  const { localFilters, clearFilters } = useDebounceFilters(
    tableState.filters,
    tableState.handleFilterChange
  );

  const { getQueryParams, setTotalPages, setTotalElements } = tableState;

  useEffect(() => {
    const loadPolicies = async () => {
      try {
        setLoading(true);
        const params = getQueryParams();
        
        // Match old specific 'status' logic mapped to 'PAYMENT_PENDING' etc
        if (params.status === 'PAYMENT_PENDING') {
          // This ensures the backend gets the correct enum format if needed, though backend handles it
        }

        const res = await getAllPoliciesPaginated(params);
        setPolicies(res.content || []);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || res.totalRecords || 0);
      } catch (error) {
        console.error("Error loading policies:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPolicies();
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
    { header: renderHeader("Policy Number", "policyNumber"), cell: (row) => <span className="fw-semibold">{row.policyNumber}</span> },
    { header: "Customer Name", accessor: "customerName" },
    { header: "Plan Name", accessor: "planName" },
    {
      header: "Premium Amount (₹)",
      cell: (row) => <span className="fw-semibold">{formatINR(row.calculatedPremium)}</span>,
    },
    { header: "Start Date", accessor: "startDate" },
    { header: "Expiry Date", accessor: "endDate" },
    {
      header: renderHeader("Status", "policyStatus"),
      cell: (row) => <StatusBadge status={row.policyStatus} />,
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="d-flex align-items-center gap-2">
          <Link
            to={`/staff/policies/${row.policyId}`}
            className="btn btn-sm btn-light text-primary border-0"
            title="View Details"
            onClick={(e) => e.stopPropagation()}
          >
            <i className="bi bi-eye" />
          </Link>
          {row.policyStatus?.toUpperCase() === "PAYMENT_PENDING" && (
            <Link
              to={`/staff/payments/create/${row.policyId}`}
              className="btn btn-sm btn-success"
              onClick={(e) => e.stopPropagation()}
            >
              Pay
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Policy Management"
        subtitle="Track your client policies"
        action={
          <div className="d-flex align-items-center gap-2">
            <ExportButton
              fetchAll={async () => {
                const res = await getAllPoliciesPaginated({...tableState.getQueryParams(),  pageSize: tableState.totalElements || 1000, pageNumber: 0 });
                return res.content || [];
              }}
              columns={[
                { header: "Policy Number", accessor: "policyNumber" },
                { header: "Customer Name", accessor: "customerName" },
                { header: "Plan Name", accessor: "planName" },
                { header: "Premium Amount (₹)", accessor: "calculatedPremium" },
                { header: "Status", accessor: "policyStatus" },
              ]}
              filename="Staff_policies_list.csv"
            />
            <button
              className="btn btn-secondary d-inline-flex align-items-center gap-1"
              onClick={() => navigate("/staff/dashboard")}
            >
              <i className="bi bi-arrow-left"></i>
              Back
            </button>
          </div>
        }
      />
      
      <div className="card border-0" style={{ borderRadius: 16, boxShadow: "var(--ip-shadow-md)" }}>
        <div className="card-body p-0">
          <div className="p-4 border-bottom border-light">
            <div className="ip-table-toolbar">
              <div className="ip-table-toolbar-left">
                <h6 className="ip-table-title">All Policies</h6>
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
              data={policies}
              loading={loading}
              onRowClick={(row) => navigate(`/staff/policies/${row.policyId}`)}
            />
            <PaginationBar
              currentPage={tableState.currentPage}
              totalPages={tableState.totalPages}
              onPageChange={tableState.setCurrentPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffPolicyListPage;
