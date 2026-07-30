import { useState, useCallback } from 'react';
import usePagination from './usePagination';

const useTableState = ({ initialSortBy = 'id', initialSortDirection = 'desc', initialFilters = {} } = {}) => {
  const pagination = usePagination(1, 10);
  
  // Sorting
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortDirection, setSortDirection] = useState(initialSortDirection);
  
  // Loading
  const [isLoading, setIsLoading] = useState(false);

  // Generic Filters
  const [filters, setFilters] = useState(initialFilters);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const setCurrentPage = pagination.setCurrentPage;

  const handleFilterChange = useCallback((updates) => {
    setFilters(prev => ({ ...prev, ...updates }));
    setCurrentPage(1);
  }, [setCurrentPage]);

  const getQueryParams = useCallback(() => {
    const params = {
      ...pagination.pageParams,
      sortBy,
      sortDirection
    };

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '') {
        params[key] = value;
      }
    });
    
    return params;
  }, [pagination.pageParams, sortBy, sortDirection, filters]);

  const getSrNo = useCallback((index) => {
    return (pagination.currentPage - 1) * pagination.pageSize + index + 1;
  }, [pagination.currentPage, pagination.pageSize]);

  return {
    ...pagination, // currentPage, setCurrentPage, totalPages, setTotalPages, etc.
    sortBy,
    sortDirection,
    handleSort,
    filters,
    handleFilterChange,
    getQueryParams,
    getSrNo,
    isLoading,
    setIsLoading
  };
};

export default useTableState;
