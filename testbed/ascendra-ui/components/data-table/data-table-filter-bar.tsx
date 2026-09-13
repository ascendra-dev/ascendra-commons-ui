import { useDataTableColumns, useDataTableFilter } from '@/ascendra-ui/providers/data-table/data-table.provider';
import { DataTableFilterItem } from './data-table-filter-item';

export function DataTableFilterBar() {
  const { columns } = useDataTableColumns();
  const { filters, getOptionsFor, setFilterValue, removeFilter, clearFilters } = useDataTableFilter();

  if (filters.length === 0) return null;

  return (
    <div className="mt-1 -mb-2 flex flex-wrap items-center gap-2">
      {filters.map((f) => {
        const col = columns.find((c) => String(c.key) === f.key);
        return (
          <DataTableFilterItem
            key={f.key}
            columnKey={f.key}
            label={col?.label ?? f.key}
            options={getOptionsFor(f.key)}
            value={f.value}
            onChange={setFilterValue}
            onRemove={removeFilter}
          />
        );
      })}
      <span className="text-muted-foreground cursor-pointer text-xs" onClick={clearFilters}>
        Clear filters
      </span>
    </div>
  );
}
