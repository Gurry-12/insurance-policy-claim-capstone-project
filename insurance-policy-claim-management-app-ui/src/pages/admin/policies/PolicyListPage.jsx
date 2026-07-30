import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/tables/DataTable';
import PaginationBar from '../../../components/tables/PaginationBar';
import StatusBadge from '../../../components/ui/StatusBadge';
import FilterPanel from '../../../components/ui/FilterPanel';
import FilterChips from '../../../components/ui/FilterChips';
import { getAllPoliciesPaginated } from '../../../services/policyService';
import ErrorAlert from '../../../components/ui/ErrorAlert';
import useTableState from '../../../hooks/useTableState';
import SortableHeader from '../../../components/tables/SortableHeader';
import useDebounceFilters from '../../../hooks/useDebounceFilters';
import ExportButton from '../../../components/common/ExportButton';
import { POLICY_STATUS_OPTIONS } from '../../../utils/options';

const FILTER_FIELDS = [
  { type: 'select', name: 'status', label: 'Policy Status',
    options: POLICY_STATUS_OPTIONS,
  },
];

const PolicyListPage = () => {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const tableState = useTableState({
    initialSortBy: 'id',
    initialFilters: { status: '', startDate: '', endDate: '' }
  });

  const { localFilters, clearFilters } = useDebounceFilters(
    tableState.filters,
    tableState.handleFilterChange
  );

  const { getQueryParams, setTotalPages, setTotalElements } = tableState;

  const fetchPolicies = useCallback(() => {
    setLoading(true);
    const params = getQueryParams();

    getAllPoliciesPaginated(params)
      .then((res) => {
        setPolicies(res.content);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements || res.totalRecords || 0);
      })
      .catch(() => setError('Could not load policies. Please check your API connection.'))
      .finally(() => setLoading(false));
  }, [getQueryParams, setTotalPages, setTotalElements]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

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
    { header: renderHeader("Policy #", "policyNumber"), accessor: "policyNumber", minWidth: "100px" },
    { header: "Customer", accessor: "customerName" },
    { header: "Plan", accessor: "planName" },
    {
      header: "Premium (₹)",
      cell: (row) => `₹${(row.calculatedPremium || 0).toLocaleString("en-IN")}`,
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
        <button 
          className="btn btn-sm btn-light text-primary border-0"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/policies/${row.policyId}`);
          }}
        >
          <i className="bi bi-file-earmark-text" /> View
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader 
        title="Policies Management" 
        subtitle="View all issued insurance policies across the system"
        action={
          <div className="d-flex gap-2">
            <ExportButton
              fetchAll={async () => {
                const res = await getAllPoliciesPaginated({...tableState.getQueryParams(),  pageSize: tableState.totalElements || 1000, pageNumber: 0 });
                return res.content || [];
              }}
              filename="policies_export.csv"
              columns={[
                { header: "Policy Number",     accessor: "policyNumber" },
                { header: "Customer Name",     accessor: "customerName" },
                { header: "Plan Name",         accessor: "planName" },
                { header: "Product Type",      accessor: "productType" },
                { header: "Premium Amount (₹)",accessor: "calculatedPremium" },
                { header: "Coverage Amount (₹)",accessor: "selectedCoverage" },
                { header: "Start Date",        accessor: "startDate" },
                { header: "End Date",          accessor: "endDate" },
                { header: "Status",            accessor: "policyStatus" },
              ]}
            />
            <Link to="/admin/policies/issue" className="btn btn-primary d-inline-flex align-items-center gap-2" style={{ borderRadius: '8px' }}>
              <i className="bi bi-file-earmark-plus" />
              Issue New Policy
            </Link>
          </div>
        }
      />
      
      <ErrorAlert message={error} />

      <div className="card border-0" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
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

export default PolicyListPage;
