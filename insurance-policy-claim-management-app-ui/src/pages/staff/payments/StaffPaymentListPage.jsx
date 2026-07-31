import { useEffect, useState } from "react";
import { getAllPaymentsPaginated } from "../../../services/paymentService";
import { useNavigate } from "react-router-dom";
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
import { PAYMENT_STATUS_OPTIONS } from "../../../utils/options";
import { formatINR } from "../../../utils/formatters";

const FILTER_FIELDS = [
  {
    type: "select",
    name: "paymentStatus",
    label: "Payment Status",
    options: PAYMENT_STATUS_OPTIONS,
  },
  { type: 'amount-range', minName: 'minAmount', maxName: 'maxAmount', label: 'Amount' },
];

const StaffPaymentListPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const tableState = useTableState({
    initialSortBy: "id",
    initialSortDirection: "desc",
    initialFilters: { paymentStatus: '', minAmount: '', maxAmount: '' }
  });

  const { localFilters, clearFilters } = useDebounceFilters(
    tableState.filters,
    tableState.handleFilterChange
  );

  const { getQueryParams, setTotalPages, setTotalElements } = tableState;

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        const params = getQueryParams();
        const data = await getAllPaymentsPaginated(params);
        setPayments(data.content || []);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalRecords || data.totalElements || 0);
      } catch (error) {
        console.error("Error loading payments:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPayments();
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
    { header: "Policy Number", accessor: "policyNumber" },
    {
      header: renderHeader("Amount (₹)", "amount"),
      cell: (row) => <span className="fw-semibold">{formatINR(row.amount)}</span>,
    },
    { header: renderHeader("Payment Mode", "paymentMode"), accessor: "paymentMode" },
    { header: "Transaction Ref", accessor: "transactionReference" },
    {
      header: renderHeader("Status", "paymentStatus"),
      cell: (row) => <StatusBadge status={row.paymentStatus} />,
    },
    {
      header: renderHeader("Payment Date", "paymentDate"),
      cell: (row) => row.paymentDate ? new Date(row.paymentDate).toLocaleString() : "-",
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Payment Management"
        subtitle="Track your client premium transactions"
        action={
          <div className="d-flex gap-2">
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
                { header: "Reference", accessor: "transactionReference" },
              ]}
              filename="Staff_payments_list.csv"
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
                <h6 className="ip-table-title">All Payments</h6>
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

export default StaffPaymentListPage;
