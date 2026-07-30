import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/tables/DataTable';
import PaginationBar from '../../../components/tables/PaginationBar';
import StatusBadge from '../../../components/ui/StatusBadge';
import FilterPanel from '../../../components/ui/FilterPanel';
import FilterChips from '../../../components/ui/FilterChips';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorAlert from '../../../components/ui/ErrorAlert';
import getAllUsers from '../../../services/userService';
import useTableState from '../../../hooks/useTableState';
import SortableHeader from '../../../components/tables/SortableHeader';
import useDebounceFilters from '../../../hooks/useDebounceFilters';
import ExportButton from '../../../components/common/ExportButton';
import { ROLE_OPTIONS, STATUS_OPTIONS } from '../../../utils/options';

const FILTER_FIELDS = [
  { type: 'text',   name: 'fullName', label: 'Full Name',  placeholder: 'Search by name...' },
  { type: 'text',   name: 'email',    label: 'Email',       placeholder: 'Search by email...' },
  { type: 'select', name: 'role',     label: 'Role',
    options: ROLE_OPTIONS,
  },
  { type: 'select', name: 'isActive', label: 'Status',
    options: STATUS_OPTIONS,
  },
];

const UserListPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  const tableState = useTableState({
    initialSortBy: 'id',
    initialFilters: { fullName: '', email: '', role: '', isActive: '' }
  });

  const { localFilters, clearFilters } = useDebounceFilters(
    tableState.filters,
    tableState.handleFilterChange
  );

  const fetchUsers = () => { 
    setLoading(true);
    const params = tableState.getQueryParams();

    getAllUsers(params)
      .then((res) => {
        setUsers(res.content);
        tableState.setTotalPages(res.totalPages);
        tableState.setTotalElements(res.totalElements || res.totalRecords || 0);
      })
      .catch(() => setError('Could not load Staffs list. Check your API connection.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
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
    {
      header: renderHeader("Name", "fullName"),
      cell: (row) =>
        row.fullName ||
        `${row.firstName || ""} ${row.lastName || ""}`.trim() ||
        "N/A",
    },
    {
      header: renderHeader("Email", "email"),
      cell: (row) => row.email || "N/A",
    },
    {
      header: renderHeader("Phone", "mobileNumber"),
      cell: (row) => row.mobileNumber || row.phoneNumber || "N/A",
    },
    {
      header: renderHeader("Role", "role"),
      cell: (row) => row.role || "N/A",
    },
    {
      header: renderHeader("Status", "isActive"),
      cell: (row) => <StatusBadge status={row.isActive ? "Active" : "Inactive"} />,
    },
    {
      header: "Actions",
      cell: (row) => (
        <button
          className="btn btn-sm btn-light text-primary border-0"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/users/${row.id}`);
          }}
        >
          <i className="bi bi-eye" /> View
        </button>
      ),
    },
  ];

  
  const handleRemoveFilter = (updates) => {
    tableState.handleFilterChange(updates);
  };

  return (
    <div>
      <PageHeader 
        title="Users Management" 
        subtitle="Manage and view administrators, Staffs, and customer accounts"
        action={
          <div className="d-flex gap-2">
            <ExportButton
              fetchAll={async () => {
                const res = await getAllUsers({...tableState.getQueryParams(),  pageSize: tableState.totalElements || 1000, pageNumber: 0 });
                return res.content || [];
              }}
              filename="Users_Export"
              columns={[
                { header: "Full Name", accessor: "fullName" },
                { header: "Email Address", accessor: "email" },
                { header: "Mobile Number", exportValue: (r) => r.mobileNumber ? (r.mobileNumber.startsWith("+91") ? r.mobileNumber : `+91${r.mobileNumber}`) : "N/A" },
                { header: "Role", accessor: "role" },
                { header: "Active Status", exportValue: (r) => r.isActive ? "Active" : "Inactive" }
              ]}
            />
            <Link to="/admin/users/create" className="btn btn-primary d-inline-flex align-items-center gap-2" style={{ borderRadius: '8px' }}>
              <i className="bi bi-plus-lg" />
              Add New Staff
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
                <h6 className="ip-table-title">All Users</h6>
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
              onRemove={handleRemoveFilter}
              onClearAll={clearFilters}
            />
          </div>
          <div className="p-4">
            {loading ? (
              <LoadingSpinner text="Fetching Staffs..." />
            ) : (
              <>
                <DataTable 
                  columns={columns} 
                  data={users} 
                  onRowClick={(row) => navigate(`/admin/users/${row.id}`)}
                />
                <PaginationBar 
                  currentPage={tableState.currentPage} 
                  totalPages={tableState.totalPages} 
                  onPageChange={tableState.setCurrentPage} 
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserListPage;
