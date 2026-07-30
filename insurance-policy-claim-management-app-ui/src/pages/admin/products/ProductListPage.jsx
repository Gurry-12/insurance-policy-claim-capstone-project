import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/tables/DataTable';
import PaginationBar from '../../../components/tables/PaginationBar';
import StatusBadge from '../../../components/ui/StatusBadge';
import FilterPanel from '../../../components/ui/FilterPanel';
import FilterChips from '../../../components/ui/FilterChips';
import ErrorAlert from '../../../components/ui/ErrorAlert';
import { getAllProductsPaginated } from '../../../services/productService';
import useTableState from '../../../hooks/useTableState';
import SortableHeader from '../../../components/tables/SortableHeader';
import useDebounceFilters from '../../../hooks/useDebounceFilters';
import ExportButton from '../../../components/common/ExportButton';
import { STATUS_OPTIONS } from '../../../utils/options';

const FILTER_FIELDS = [
  { type: 'text',   name: 'productName', label: 'Product Name', placeholder: 'Search by name...' },
  { type: 'select', name: 'productType', label: 'Category',
    options: [
      { value: 'HEALTH',    label: 'Health' },
      { value: 'MOTOR',     label: 'Motor' },
      { value: 'LIFE',      label: 'Life' },
      { value: 'TRAVEL',    label: 'Travel' },
      { value: 'INSURANCE', label: 'Insurance' },
    ],
  },
  { type: 'select', name: 'isActive', label: 'Status',
    options: STATUS_OPTIONS,
  },
];

const ProductListPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const tableState = useTableState({
    initialSortBy: 'id',
    initialFilters: { productName: '', productType: '', isActive: '' }
  });

  const { localFilters, clearFilters } = useDebounceFilters(
    tableState.filters,
    tableState.handleFilterChange
  );

  const fetchProducts = () => {
    setLoading(true);
    const params = tableState.getQueryParams();

    getAllProductsPaginated(params)
      .then((res) => {
        setProducts(res.content);
        tableState.setTotalPages(res.totalPages);
        tableState.setTotalElements(res.totalElements || res.totalRecords || 0);
      })
      .catch(() => setError('Could not load products. Please check your API connection.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
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
    { header: renderHeader("Name", "productName"), accessor: "productName" },
    { header: renderHeader("Category", "productType"), accessor: "productType" },
    { header: "Created", accessor: "createdDate" },
    {
      header: "Status",
      cell: (row) => (row.isActive ?? row.active) ? <StatusBadge status={"Active"}/> : <StatusBadge status={"InActive"}/>,
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-light text-primary border-0"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/products/${row.productId}`);
            }}
            title="View Details"
          >
            <i className="bi bi-eye" />
          </button>
          <button
            className="btn btn-sm btn-light text-primary border-0"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/products/edit/${row.productId}`);
            }}
            title="Edit Product"
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
        title="Insurance Products"
        subtitle="Manage product categories and offerings"
        action={
          <div className="d-flex gap-2">
            <ExportButton
              fetchAll={async () => {
                const res = await getAllProductsPaginated({...tableState.getQueryParams(), pageSize: tableState.totalElements || 1000, pageNumber: 0});
                return res.content || [];
              }}
              columns={[
                { header: "Product Name", accessor: "productName" },
                { header: "Product Type", accessor: "productType" },
                { header: "Active Status", exportValue: (r) => r.isActive ? "Active" : "Inactive" }
              ]}
              filename="products_list.csv"
            />
            <Link
              to="/admin/products/create"
              className="btn btn-primary d-inline-flex align-items-center gap-2"
              style={{ borderRadius: "8px" }}
            >
              <i className="bi bi-plus-lg" />
              Create Product
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
                <h6 className="ip-table-title">All Products</h6>
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
              data={products}
              loading={loading}
              onRowClick={(row) => navigate(`/admin/products/${row.productId}`)}
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

export default ProductListPage;
