import { useCallback, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

const useTableSort = <Field extends string>(defaultField: Field, defaultDirection: SortDirection = 'desc') => {
  const [sortField, setSortFieldState] = useState<Field>(defaultField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection);

  const setSortField = useCallback(
    (field: Field) => {
      setSortFieldState((currentField) => {
        if (currentField === field) {
          return currentField;
        }
        setSortDirection(defaultDirection);
        return field;
      });
    },
    [defaultDirection],
  );

  const handleSort = useCallback(
    (field: Field) => {
      setSortFieldState((currentField) => {
        if (currentField === field) {
          setSortDirection((currentDir) => (currentDir === 'asc' ? 'desc' : 'asc'));
          return currentField;
        }
        setSortDirection(defaultDirection);
        return field;
      });
    },
    [defaultDirection],
  );

  const toggleDirection = useCallback(() => {
    setSortDirection((currentDir) => (currentDir === 'asc' ? 'desc' : 'asc'));
  }, []);

  const resetSort = useCallback(() => {
    setSortFieldState(defaultField);
    setSortDirection(defaultDirection);
  }, [defaultDirection, defaultField]);

  return { sortField, sortDirection, setSortField, setSortDirection, handleSort, toggleDirection, resetSort };
};

export default useTableSort;
