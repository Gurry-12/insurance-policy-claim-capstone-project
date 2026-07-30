import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/tables/DataTable';
import PaginationBar from '../../../components/tables/PaginationBar';
import StatusBadge from '../../../components/ui/StatusBadge';
import FilterPanel from '../../../components/ui/FilterPanel';
import FilterChips from '../../../components/ui/FilterChips';
import { getAllClaimsPaginated } from '../../../services/claimService';
import useTableState from '../../../hooks/useTableState';
import SortableHeader from '../../../components/tables/SortableHeader';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import ExportButton from '../../../components/common/ExportButton';
import useDebounceFilters from '../../../hooks/useDebounceFilters';
import { CLAIM_STATUS_OPTIONS } from '../../../utils/options';

const FILTER_FIELDS = [
  { type: 'select', name: 'status', label: 'Claim Status',
    options: CLAIM_STATUS_OPTIONS,
  },
  { type: 'amount-range', minName: 'minClaimAmount', maxName: 'maxClaimAmount', label: 'Claim Amount' },
];

const ClaimListPage = () => {
  useDocumentTitle('Claims Management');
  const navigate = useNavigate();
  const [claims, setClaims] = useState(null);
  
  const tableState = useTableState({
    initialSortBy: 'createdDate',
    initialFilters: { status: '', minClaimAmount: '', maxClaimAmount: '', startDate: '', endDate: '' }
  });

  const { localFilters, clearFilters } = useDebounceFilters(
    tableState.filters,
    tableState.handleFilterChange
  );

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchClaims = () => {
      tableState.setIsLoading(true);
      const params = tableState.getQueryParams();
  
      getAllClaimsPaginated(params, { signal: controller.signal })
        .then((res) => {
          setClaims(res.content);
          tableState.setTotalPages(res.totalPages);
          tableState.setTotalElements(res.totalElements || res.totalRecords || 0);
        })
        .catch((error) => {
          if (error.name !== 'CanceledError') {
            console.log(error);
          }
        })
        .finally(() => {
          tableState.setIsLoading(false);
        });
    };

    fetchClaims();

    return () => {
      controller.abort();
    };
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

  const columns = [
    { 
      header: "Sr. No.",
      cell: (row, index) => tableState.getSrNo(index), 
      minWidth: "85px" 
    },
    { header: renderHeader("Claim Number", "claimNumber"), accessor: "claimNumber", minWidth: "100px" },
    { header: "Customer", accessor: "customerName" },
    {
      header: renderHeader("Amount (₹)", "claimAmount"),
      cell: (row) => `₹${row.claimAmount.toLocaleString("en-IN")}`,
    },
    {
      header: renderHeader("Status", "claimStatus"),
      cell: (row) => <StatusBadge status={row.claimStatus} />,
    },
    { header: renderHeader("Policy Number", "policyNumber"), accessor: "policyNumber" },
    {
      header: "Actions",
      cell: (row) => (
        <div className="d-flex align-items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button 
            className="btn btn-sm btn-light text-primary d-inline-flex align-items-center gap-1" 
            onClick={() => navigate(`/admin/claims/${row.claimId}`)}
            style={{ borderRadius: '6px' }}
            title="Review Claim"
          >
            <i className="bi bi-eye" /> Review
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Claims Management"
        subtitle="Review and process all incoming insurance claims"
        action={
          <ExportButton
            fetchAll={async () => {
                const res = await getAllClaimsPaginated({...tableState.getQueryParams(),  pageSize: tableState.totalElements || 1000, pageNumber: 0 });
              return res.content || [];
            }}
            columns={[
              { header: "Claim Number",    accessor: "claimNumber" },
              { header: "Customer Name",   accessor: "customerName" },
              { header: "Claim Amount (₹)",accessor: "claimAmount" },
              { header: "Status",          accessor: "claimStatus" },
              { header: "Policy Number",   accessor: "policyNumber" },
              { header: "Incident Date",   accessor: "incidentDate" },
              { header: "Filed Date",      accessor: "createdDate" },
            ]}
            filename="claims_export.csv"
          />
        }
      />

      <div
        className="card border-0"
        style={{ borderRadius: 16, boxShadow: "var(--ip-shadow-md)" }}
      >
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
              data={claims || []}
              loading={tableState.isLoading}
              onRowClick={(row) => navigate(`/admin/claims/${row.claimId}`)}
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

export default ClaimListPage;
