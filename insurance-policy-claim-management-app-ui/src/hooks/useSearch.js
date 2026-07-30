
import { useMemo, useState } from "react";

const useSearch = (data = [], fields = []) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const term = searchTerm.toLowerCase();

    return data.filter((item) =>
      fields.some((field) => {
        const value = item[field];

        return String(value ?? "")
          .toLowerCase()
          .includes(term);
      })
    );
  }, [data, searchTerm, fields]);

  return {
    searchTerm,
    setSearchTerm,
    filteredData,
  };
};

export default useSearch;