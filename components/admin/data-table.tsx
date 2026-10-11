"use client";

import { useMemo } from "react";
import {
  createColumnHelper,
  rowSelectionFeature,
  tableFeatures,
  useTable,
  type RowSelectionState,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Thin wrapper around TanStack Table v9 used by admin data grids (leads, audit log).

export const features = tableFeatures({ rowSelectionFeature });

export type DataColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  srOnlyHeader?: boolean;
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  selection,
  onSelectionChange,
  empty,
  rowClassName,
  minWidth = "48rem",
}: {
  rows: T[];
  columns: DataColumn<T>[];
  selection?: RowSelectionState;
  onSelectionChange?: (s: RowSelectionState) => void;
  empty?: React.ReactNode;
  rowClassName?: (row: T) => string | undefined;
  minWidth?: string;
}) {
  const selectable = Boolean(onSelectionChange);
  const helper = useMemo(() => createColumnHelper<typeof features, T>(), []);
  const defs = useMemo(
    () =>
      helper.columns([
        ...(selectable
          ? [
              helper.display({
                id: "_select",
                header: ({ table }) => (
                  <Checkbox
                    aria-label="Select all rows"
                    checked={
                      table.getIsAllRowsSelected()
                        ? true
                        : table.getIsSomeRowsSelected()
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={(v) => table.toggleAllRowsSelected(v === true)}
                  />
                ),
                cell: ({ row }) => (
                  <Checkbox
                    aria-label="Select row"
                    checked={row.getIsSelected()}
                    onCheckedChange={(v) => row.toggleSelected(v === true)}
                  />
                ),
              }),
            ]
          : []),
        ...columns.map((c) =>
          helper.display({
            id: c.id,
            header: () => (c.srOnlyHeader ? <span className="sr-only">{c.header}</span> : c.header),
            cell: ({ row }) => c.cell(row.original),
          }),
        ),
      ]),
    [helper, columns, selectable],
  );

  const table = useTable({
    features,
    columns: defs,
    data: rows,
    getRowId: (r) => r.id,
    state: { rowSelection: selection ?? {} },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(selection ?? {}) : updater;
      onSelectionChange?.(next);
    },
    enableRowSelection: selectable,
  });

  const classFor = (id: string) => columns.find((c) => c.id === id)?.className;

  return (
    <div className="border-border bg-surface overflow-x-auto rounded-2xl border shadow-[var(--shadow-soft)]">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className="border-border bg-surface-2/60 text-muted-foreground border-b text-xs tracking-wider uppercase">
          {table.getHeaderGroups().map((g) => (
            <tr key={g.id}>
              {g.headers.map((h) => (
                <th
                  key={h.id}
                  scope="col"
                  className={cn(
                    "px-3 py-3 font-semibold",
                    h.column.id === "_select" && "w-10",
                    classFor(h.column.id),
                  )}
                >
                  {h.isPlaceholder ? null : <table.FlexRender header={h} />}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                "border-border hover:bg-surface-2/50 border-b last:border-0",
                row.getIsSelected() && "bg-primary-soft/40",
                rowClassName?.(row.original),
              )}
            >
              {row.getAllCells().map((cell) => (
                <td key={cell.id} className={cn("px-3 py-2.5 align-middle", classFor(cell.column.id))}>
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length ? (
        <div className="text-muted-foreground px-6 py-14 text-center">{empty ?? "Nothing to show."}</div>
      ) : null}
    </div>
  );
}
