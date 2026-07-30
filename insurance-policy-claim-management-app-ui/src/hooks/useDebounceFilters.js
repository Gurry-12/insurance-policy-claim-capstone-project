import { useState, useEffect, useRef } from 'react';

const useDebounceFilters = (initialFilters, onFilterChange, delay = 500) => {
  const [localFilters, setLocalFilters] = useState(initialFilters);
  const prevFiltersRef = useRef(initialFilters);

  useEffect(() => {
    if (prevFiltersRef.current === localFilters) {
      return;
    }
    prevFiltersRef.current = localFilters;

    const handler = setTimeout(() => {
      onFilterChange(localFilters);
    }, delay);
    return () => clearTimeout(handler);
  }, [localFilters, onFilterChange, delay]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    const cleared = Object.keys(localFilters).reduce((acc, key) => {
      acc[key] = '';
      return acc;
    }, {});
    setLocalFilters(cleared);
  };

  return { localFilters, handleFilterChange, clearFilters };
};

export default useDebounceFilters;
