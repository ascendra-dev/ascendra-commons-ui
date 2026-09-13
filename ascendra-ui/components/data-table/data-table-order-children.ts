import * as React from 'react';

export function orderChildrenByColumn(
  columns: { key: PropertyKey }[],
  children: React.ReactNode,
): React.ReactElement[] {
  const columnChildMap = new Map<string, React.ReactElement>();
  const prefixChildren: React.ReactElement[] = [];
  const suffixChildren: React.ReactElement[] = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const column = (child.props as { column?: string }).column;
      const isLastColumn = (child.type as { isLastColumn?: boolean }).isLastColumn === true;
      if (column) {
        columnChildMap.set(column, child);
      } else if (isLastColumn) {
        suffixChildren.push(child);
      } else {
        prefixChildren.push(child);
      }
    }
  });

  const orderedColumnChildren = columns
    .map((col) => columnChildMap.get(String(col.key)))
    .filter((c): c is React.ReactElement => c !== undefined);

  return [...prefixChildren, ...orderedColumnChildren, ...suffixChildren];
}
