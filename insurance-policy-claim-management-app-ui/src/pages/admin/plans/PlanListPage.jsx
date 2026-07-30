import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/tables/DataTable';
import PaginationBar from '../../../components/tables/PaginationBar';
import StatusBadge from '../../../components/ui/StatusBadge';
import FilterPanel from '../../../components/ui/FilterPanel';
import FilterChips from '../../../components/ui/FilterChips';
import ErrorAlert from '../../../components/ui/ErrorAlert';
import { getAllPlansPaginated } from '../../../services/planService';
import useTableState from '../../../hooks/useTableState';
import SortableHeader from '../../../components/tables/SortableHeader';
import useDebounceFilters from '../../../hooks/useDebounceFilters';
import ExportButton from '../../../components/common/ExportButton';

import { STATUS_OPTIONS } from '../../../utils/options';

const FILTER_FIELDS = [
  { type: 'select', name: 'isActive', label: 'Status',
    options: STATUS_OPTIONS,
  },
  { type: 'text',         name: 'planName',        label: 'Plan Name',       placeholder: 'Search by plan name...' },
  { type: 'amount-range', minName: 'minCoverageAmount', maxName: 'maxCoverageAmount', label: 'Coverage Amount' },
  { type: 'amount-range', minName: 'minPremiumAmount',  maxName: 'maxPremiumAmount',  label: 'Premium Amount' },
];

const PlanListPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const tableState = useTableState({
    initialSortBy: 'createdDate',
    initialSortDirection: 'desc',
    initialFilters: { planName: '', minCoverageAmount: '', maxCoverageAmount: '', minPremiumAmount: '', maxPremiumAmount: '' }
  });

  const { localFilters, clearFilters } = useDebounceFilters(
    tableState.filters,
    tableState.handleFilterChange
  );

  const fetchPlans = () => {
    setLoading(true);
    const params = tableState.getQueryParams();

    getAllPlansPaginated(params)
      .then((res) => {
        setPlans(res.content);
        tableState.setTotalPages(res.totalPages);
        tableState.setTotalElements(res.totalElements || res.totalRecords || 0);
      })
      .catch(() => setError('Could not load plans. Please check your API connection.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlans();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tableState.currentPage, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(tableState.filters),
    tableState.sortBy, 
    tableState.sortDirection
  ]);

  const renderHeader = (label, field) => (
    <SortableHeader 
      label={label} 
      field={field} 
      currentSortBy={tableState.sortBy} 
      currentDirection={tableState.sortDirection} 
      onSort={tableState.handleSort} 
    />
  );

  const getCoverageRange = (plan) => {
    if (!plan.coverageOptions || plan.coverageOptions.length === 0) return 'No coverage options';
    const amounts = plan.coverageOptions.map(opt => opt.coverageAmount || opt);
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`;
  };

  const getDurationRange = (plan) => {
    if (!plan.allowedDurations || plan.allowedDurations.length === 0) return 'No durations';
    const min = Math.min(...plan.allowedDurations);
    const max = Math.max(...plan.allowedDurations);
    return min === max ? `${min} yr` : `${min} - ${max} yrs`;
  };

  const columns = [
    { 
      header: "Sr. No.",
      cell: (row, index) => tableState.getSrNo(index), 
      minWidth: "85px" 
    },
    { header: renderHeader("Plan Name", "planName"), accessor: "planName" },
    { header: "Product Name", accessor: "productName" },
    {
      header: "Coverage Range (₹)",
      cell: (row) => getCoverageRange(row),
    },
    {
      header: "Premium Type",
      cell: (row) => row.supportedPremiumType
        ? row.supportedPremiumType.replace('_', ' ')
        : row.supportedPremiumTypes?.join(", ") || "None",
    },
    { header: "Duration", cell: (row) => getDurationRange(row) },
    { header: renderHeader("Created", "createdDate"), cell: (row) => new Date(row.createdDate).toLocaleDateString() },
    {
      header: "Status",
      cell: (row) => ((row.isActive ?? row.active) ? <StatusBadge status={"Active"} /> : <StatusBadge status={"InActive"} />),
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-light text-primary border-0"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/plans/${row.planId}`);
            }}
            title="View Details"
          >
            <i className="bi bi-eye" />
          </button>
          <button
            className="btn btn-sm btn-light text-primary border-0"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/plans/edit/${row.planId}`);
            }}
            title="Edit Plan"
          >
            <i className="bi bi-pencil-square" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Insurance Plans"
        subtitle="Manage specific plans and coverages under products"
        action={
          <div className="d-flex gap-2">
            <ExportButton
              fetchAll={async () => {
                const res = await getAllPlansPaginated({...tableState.getQueryParams(), pageSize: tableState.totalElements || 1000, pageNumber: 0});
                return res.content || [];
              }}
              columns={[
                { header: "Plan Name", accessor: "planName" },
                { header: "Product Name", accessor: "productName" },
                { header: "Coverage Range (₹)", exportValue: (r) => getCoverageRange(r) },
                { header: "Premium Type", exportValue: (r) => r.supportedPremiumType?.replace('_', ' ') || r.supportedPremiumTypes?.join(", ") || "None" },
                { header: "Duration Range (Years)", exportValue: (r) => getDurationRange(r) },
                { header: "Active Status", exportValue: (r) => (r.isActive ?? r.active) ? "Active" : "Inactive" }
              ]}
              filename="plans_list.csv"
            />
            <Link
              to="/admin/plans/create"
              className="btn btn-primary d-inline-flex align-items-center gap-2"
              style={{ borderRadius: "8px" }}
            >
              <i className="bi bi-plus-lg" />
              Create Plan
            </Link>
          </div>
        }
      />

      <ErrorAlert message={error} />

      <div className="card border-0" style={{ borderRadius: 16, boxShadow: "var(--ip-shadow-md)" }}>
        <div className="card-body p-0">
          <div className="p-4 border-bottom border-light">
            <div className="ip-table-toolbar">
              <div className="ip-table-toolbar-left">
                <h6 className="ip-table-title">All Plans</h6>
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
              data={plans}
              loading={loading}
              onRowClick={(row) => navigate(`/admin/plans/${row.planId}`)}
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

export default PlanListPage;
