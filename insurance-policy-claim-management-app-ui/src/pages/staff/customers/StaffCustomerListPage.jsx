import { useEffect, useState } from "react";
import { getAllCustomersPaginated } from "../../../services/customerService";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import ExportButton from "../../../components/common/ExportButton";
import useTableState from "../../../hooks/useTableState";
import PaginationBar from "../../../components/tables/PaginationBar";
import DataTable from "../../../components/tables/DataTable";
import FilterPanel from "../../../components/ui/FilterPanel";
import FilterChips from "../../../components/ui/FilterChips";
import SortableHeader from "../../../components/tables/SortableHeader";
import useDebounceFilters from "../../../hooks/useDebounceFilters";

const FILTER_FIELDS = [
  { type: 'text', name: 'city',    label: 'City',     placeholder: 'Search by city...' },
  { type: 'text', name: 'state',   label: 'State',    placeholder: 'Search by state...' },
  { type: 'text', name: 'pinCode', label: 'PIN Code', placeholder: 'Search by PIN...' },
];

const StaffCustomerListPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const tableState = useTableState({
    initialSortBy: "id",
    initialSortDirection: "desc",
    initialFilters: { city: '', state: '', pinCode: '' }
  });

  const { localFilters, clearFilters } = useDebounceFilters(
    tableState.filters,
    tableState.handleFilterChange
  );

  const { getQueryParams, setTotalPages, setTotalElements } = tableState;

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const params = getQueryParams();
        const res = await getAllCustomersPaginated(params);
        setCustomers(res.content || []);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || res.totalRecords || 0);
      } catch (error) {
        console.error("Error loading customers:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
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
    { header: "Full Name", accessor: "fullName", cell: (row) => <span className="fw-semibold">{row.fullName}</span> },
    { header: "Email", accessor: "email" },
    { header: "Mobile", accessor: "mobileNumber" },
    { header: renderHeader("City", "city"), accessor: "city" },
    { header: "State", accessor: "state" },
    {
      header: "Actions",
      cell: (row) => (
        <button
          className="btn btn-sm btn-light text-primary border-0"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/staff/customers/${row.customerId}`);
          }}
        >
          <i className="bi bi-eye" /> View
        </button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Customer Management"
        subtitle="Manage and view your registered clients"
        action={
          <div className="d-flex gap-2">
            <ExportButton
              fetchAll={async () => {
                const res = await getAllCustomersPaginated({...tableState.getQueryParams(),  pageSize: tableState.totalElements || 1000, pageNumber: 0 });
                return res.content || [];
              }}
              columns={[
                { header: "Customer Name", accessor: "fullName" },
                { header: "Email Address", accessor: "email" },
                { header: "Mobile Number", exportValue: (r) => r.mobileNumber ? (r.mobileNumber.startsWith("+91") ? r.mobileNumber : `+91${r.mobileNumber}`) : "N/A" },
                { header: "City", accessor: "city" },
                { header: "State", accessor: "state" },
                { header: "Nominee Name", accessor: "nomineeName" },
                { header: "Nominee Relation", accessor: "nomineeRelation" },
              ]}
              filename="Staff_customers_list.csv"
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
                <h6 className="ip-table-title">All Customers</h6>
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
              data={customers}
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

export default StaffCustomerListPage;
