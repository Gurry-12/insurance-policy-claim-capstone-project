import { useState, useEffect, useCallback } from 'react';
import { notify } from '../utils/notificationService';

export const useApiTable = (fetchFunction, initialParams = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [pagination, setPagination] = useState({
    pageNumber: 0,
    pageSize: 10,
    totalRecords: 0,
    totalPages: 0,
  });
  
  const [params, setParams] = useState({ page: 0, size: 10, ...initialParams });

  const fetchData = useCallback(async (currentParams = params) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFunction(currentParams);
      if (response.success) {
        setData(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (err) {
      setError(err);
      notify.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (newPage) => {
    setParams(prev => ({ ...prev, page: newPage }));
  };

  const handleSortChange = (sortField, sortDir) => {
    setParams(prev => ({ ...prev, sort: `${sortField},${sortDir}`, page: 0 }));
  };

  const handleFilterChange = (newFilters) => {
    setParams(prev => ({ ...prev, ...newFilters, page: 0 }));
  };

  return {
    data,
    loading,
    error,
    pagination,
    params,
    handlePageChange,
    handleSortChange,
    handleFilterChange,
    refresh: fetchData
  };
};
