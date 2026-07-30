import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/tables/DataTable';
import PaginationBar from '../../../components/tables/PaginationBar';
import FilterPanel from '../../../components/ui/FilterPanel';
import FilterChips from '../../../components/ui/FilterChips';
import { getAllCustomersPaginated } from '../../../services/customerService';
import useTableState from '../../../hooks/useTableState';
import SortableHeader from '../../../components/tables/SortableHeader';
import useDebounceFilters from '../../../hooks/useDebounceFilters';
import ExportButton from '../../../components/common/ExportButton';

const FILTER_FIELDS = [
  { type: 'text', name: 'city',    label: 'City',     placeholder: 'Search by city...' },
  { type: 'text', name: 'state',   label: 'State',    placeholder: 'Search by state...' },
  { type: 'text', name: 'pinCode', label: 'PIN Code', placeholder: 'Search by PIN...' },
];

const CustomerListPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState(null);
  const tableState = useTableState({ 
    initialSortBy: 'id',
    initialFilters: { city: '', state: '', pinCode: '' }
  });

  const { localFilters, clearFilters } = useDebounceFilters(
    tableState.filters,
    tableState.handleFilterChange
  );

  const fetchCustomers = () => {
    const params = tableState.getQueryParams();

    getAllCustomersPaginated(params)
      .then((res) => {
        setCustomers(res.content);
        tableState.setTotalPages(res.totalPages);
        tableState.setTotalElements(res.totalElements || res.totalRecords || 0);
      })
      .catch((error) => console.log(error));
  };

  useEffect(() => {
    fetchCustomers();
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
      minWidth: "85px",
    },
    { header: "Name", accessor: "fullName" },
    { header: "Email", accessor: "email" },
    { header: "Phone", accessor: "mobileNumber" },
    { header: renderHeader("Joined", "createdDate"), accessor: "createdDate" },
    {
      header: renderHeader("City", "city"),
      accessor: "city"
    },
    {
      header: "Actions",
      cell: (row) => (
        <button
          className="btn btn-sm btn-light text-primary border-0"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/customers/${row.customerId}`);
          }}
        >
          <i className="bi bi-eye" /> View
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader 
        title="Customers Management" 
        subtitle="View and manage all registered customers"
        action={
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
              { header: "Nominee Relation", accessor: "nomineeRelation" }
            ]}
            filename="customers_list.csv"
          />
        }
      />
      
      <div className="card border-0" style={{ borderRadius: 16, boxShadow: 'var(--ip-shadow-md)' }}>
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

export default CustomerListPage;
