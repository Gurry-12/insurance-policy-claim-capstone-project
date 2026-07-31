import { useEffect, useState } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/tables/DataTable';
import PaginationBar from '../../../components/tables/PaginationBar';
import StatusBadge from '../../../components/ui/StatusBadge';
import FilterPanel from '../../../components/ui/FilterPanel';
import FilterChips from '../../../components/ui/FilterChips';
import { getAllPaymentsPaginated } from '../../../services/paymentService';
import ErrorAlert from '../../../components/ui/ErrorAlert';
import useTableState from '../../../hooks/useTableState';
import SortableHeader from '../../../components/tables/SortableHeader';
import useDebounceFilters from '../../../hooks/useDebounceFilters';
import ExportButton from '../../../components/common/ExportButton';
import { PAYMENT_STATUS_OPTIONS } from '../../../utils/options';
import { formatINR } from '../../../utils/formatters';

const FILTER_FIELDS = [
  { type: 'select', name: 'paymentStatus', label: 'Payment Status',
    options: PAYMENT_STATUS_OPTIONS,
  },
  { type: 'amount-range', minName: 'minAmount', maxName: 'maxAmount', label: 'Amount' },
];

const PaymentListPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const tableState = useTableState({
    initialSortBy: 'id',
    initialSortDirection: 'desc',
    initialFilters: { paymentStatus: '', minAmount: '', maxAmount: '', startDate: '', endDate: '' }
  });

  const { localFilters, clearFilters } = useDebounceFilters(
    tableState.filters,
    tableState.handleFilterChange
  );

  const fetchPayments = () => {
    setLoading(true);
    const params = tableState.getQueryParams();

    getAllPaymentsPaginated(params)
      .then((res) => {
        setPayments(res.content);
        tableState.setTotalPages(res.totalPages);
        tableState.setTotalElements(res.totalElements || res.totalRecords || 0);
      })
      .catch(() => setError('Could not load payment transactions. Please check your API connection.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
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
    {
      header: "Reference No.",
      accessor: "transactionReference",
    },
    { header: "Policy #", accessor: "policyNumber" },
    {
      header: renderHeader("Amount (₹)", "amount"),
      cell: (row) => formatINR(row.amount),
    },
    { header: renderHeader("Payment Method", "paymentMode"), accessor: "paymentMode" },
    { header: renderHeader("Date", "paymentDate"), accessor: "paymentDate", cell: (row) => new Date(row.paymentDate).toLocaleDateString() },
    {
      header: renderHeader("Status", "paymentStatus"),
      cell: (row) => <StatusBadge status={row.paymentStatus} />,
    },
  ];

  return (
    <div>
      <PageHeader 
        title="Payments & Transactions" 
        subtitle="View all incoming payments and transaction history"
        action={
          <ExportButton
            fetchAll={async () => {
                const res = await getAllPaymentsPaginated({...tableState.getQueryParams(),  pageSize: tableState.totalElements || 1000, pageNumber: 0 });
              return res.content || [];
            }}
            columns={[
              { header: "Policy Number", accessor: "policyNumber" },
              { header: "Amount (₹)", accessor: "amount" },
              { header: "Payment Mode", accessor: "paymentMode" },
              { header: "Status", accessor: "paymentStatus" },
              { header: "Date", accessor: "paymentDate" },
              { header: "Reference", accessor: "transactionReference" }
            ]}
            filename="payments_list.csv"
          />
        }
      />
      
      <ErrorAlert message={error} />
      
      <div className="card border-0" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
        <div className="card-body p-0">
          <div className="p-4 border-bottom border-light">
            <div className="ip-table-toolbar">
              <div className="ip-table-toolbar-left">
                <h6 className="ip-table-title">Recent Transactions</h6>
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
              data={payments} 
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

export default PaymentListPage;
