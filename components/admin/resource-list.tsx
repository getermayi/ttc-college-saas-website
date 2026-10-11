"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Ellipsis,
  ExternalLink,
  Eye,
  GripVertical,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { getPath, getResource, type ColumnDef } from "@/lib/admin/resources";
import {
  deleteRecords,
  duplicateRecord,
  reorderRecords,
  setRecordsStatus,
  toggleBoolean,
} from "@/lib/admin/resource-actions";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input, NativeSelect } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Row = Record<string, unknown> & { id: string };

function Cell({
  col,
  row,
  resourceKey,
  onToggle,
}: {
  col: ColumnDef;
  row: Row;
  resourceKey: string;
  onToggle: (field: string, v: boolean) => void;
}) {
  const config = getResource(resourceKey)!;
  const v = getPath(row, col.field);
  switch (col.type) {
    case "image": {
      const m = v as { url: string; alt: string } | null;
      return m ? (
        <span className="bg-surface-2 relative block size-10 overflow-hidden rounded-lg">
          <Image src={m.url} alt={m.alt} fill sizes="40px" className="object-cover" />
        </span>
      ) : (
        <span className="bg-surface-2 block size-10 rounded-lg" aria-hidden />
      );
    }
    case "badge":
      return v ? (
        <Badge
          tone={v === "ACTIVE" || v === "PUBLISHED" ? "success" : v === "VERIFY" ? "warning" : "neutral"}
        >
          {col.labels?.[String(v)] ?? String(v)}
        </Badge>
      ) : null;
    case "status": {
      const published = config.status && v === config.status.published;
      return (
        <Badge tone={published ? "success" : "warning"}>
          {config.status?.options.find((o) => o.value === v)?.label ?? String(v)}
        </Badge>
      );
    }
    case "boolean": {
      const editable = config.fields.some((f) => f.name === col.field && f.type === "boolean");
      return editable ? (
        <Switch
          checked={Boolean(v)}
          onCheckedChange={(c) => onToggle(col.field, c)}
          aria-label={`${col.label}: ${row[config.titleField] ?? ""}`}
        />
      ) : v ? (
        <Check className="text-success size-4" aria-label="Yes" />
      ) : (
        <span className="text-muted-foreground" aria-label="No">
          —
        </span>
      );
    }
    case "date":
      return (
        <span className="text-muted-foreground whitespace-nowrap">{v ? formatDate(String(v)) : "—"}</span>
      );
    case "datetime":
      return (
        <span className="text-muted-foreground whitespace-nowrap">{v ? formatDateTime(String(v)) : "—"}</span>
      );
    case "count":
      return <span className="tabular-nums">{Array.isArray(v) ? v.length : 0}</span>;
    default:
      return (
        <span className="line-clamp-2">{v === null || v === undefined || v === "" ? "—" : String(v)}</span>
      );
  }
}

function SortableRow({
  row,
  children,
  enabled,
}: {
  row: Row;
  children: (handle: React.ReactNode) => React.ReactNode;
  enabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled: !enabled,
  });
  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "border-border hover:bg-surface-2/50 border-b last:border-0",
        isDragging && "bg-surface relative z-10 shadow-[var(--shadow-float)]",
      )}
    >
      {children(
        enabled ? (
          <button
            type="button"
            className="text-muted-foreground hover:bg-surface-2 grid size-8 cursor-grab place-items-center rounded-lg active:cursor-grabbing"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        ) : null,
      )}
    </tr>
  );
}

export function ResourceList({
  resourceKey,
  rows: initialRows,
  total,
}: {
  resourceKey: string;
  rows: Row[];
  total: number;
}) {
  const config = getResource(resourceKey)!;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [rows, setRows] = useState(initialRows);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const filtering = Boolean(params.get("q") || params.get("status"));
  const canReorder = Boolean(config.orderable) && !filtering;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const setParam = (key: string, value: string | null) => {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    router.push(`${pathname}?${sp.toString()}`);
  };

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast.error(res.message ?? "Something went wrong.");
      else if (res.message) toast.success(res.message);
      router.refresh();
    });

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);
    const next = arrayMove(rows, oldIndex, newIndex);
    setRows(next);
    run(() =>
      reorderRecords(
        resourceKey,
        next.map((r) => r.id),
      ),
    );
  }

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const ids = [...selected];

  return (
    <div className="space-y-4">
      {config.groupBy ? (
        <div role="group" aria-label="Filter" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {[{ value: "", label: "All" }, ...config.groupBy.options].map((o) => {
            const active = (params.get("group") ?? "") === o.value;
            return (
              <button
                key={o.value || "all"}
                type="button"
                aria-pressed={active}
                onClick={() => setParam("group", o.value || null)}
                className={cn(
                  "h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface hover:bg-surface-2",
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          className="relative flex-1 sm:max-w-sm"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setParam("q", q.trim() || null);
          }}
        >
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            aria-label={`Search ${config.label.toLowerCase()}`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="h-10 pl-9"
          />
        </form>
        {config.status ? (
          <NativeSelect
            aria-label="Filter by status"
            className="h-10 sm:w-48"
            value={params.get("status") ?? ""}
            onChange={(e) => setParam("status", e.target.value || null)}
          >
            <option value="">All statuses</option>
            {config.status.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        ) : null}
        {filtering ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              router.push(`${pathname}${params.get("group") ? `?group=${params.get("group")}` : ""}`);
            }}
          >
            <X aria-hidden /> Clear filters
          </Button>
        ) : null}
        <span className="text-muted-foreground text-sm sm:ml-auto">{total} total</span>
      </div>

      {selected.size ? (
        <div className="border-primary/30 bg-primary-soft text-primary-soft-foreground flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm">
          <span className="font-semibold">{selected.size} selected</span>
          <span className="flex-1" />
          {config.status ? (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => run(() => setRecordsStatus(resourceKey, ids, config.status!.published))}
              >
                <Send aria-hidden /> {config.status.published === "ACTIVE" ? "Make active" : "Publish"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => run(() => setRecordsStatus(resourceKey, ids, config.status!.draft))}
              >
                <Undo2 aria-hidden /> Unpublish
              </Button>
            </>
          ) : null}
          {config.canDelete !== false ? (
            <ConfirmDialog
              title={`Delete ${selected.size} item(s)?`}
              description="They will be removed from the website straight away. Copies are kept in version history."
              onConfirm={() => run(() => deleteRecords(resourceKey, ids))}
              trigger={
                <Button size="sm" variant="danger" disabled={pending}>
                  <Trash2 aria-hidden /> Delete
                </Button>
              }
            />
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      ) : null}

      <div className="border-border bg-surface overflow-x-auto rounded-2xl border shadow-[var(--shadow-soft)]">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-border bg-surface-2/60 text-muted-foreground border-b text-xs tracking-wider uppercase">
              <tr>
                <th scope="col" className="w-10 px-3 py-3">
                  <Checkbox
                    aria-label="Select all"
                    checked={allSelected ? true : selected.size ? "indeterminate" : false}
                    onCheckedChange={(c) =>
                      setSelected(c === true ? new Set(rows.map((r) => r.id)) : new Set())
                    }
                  />
                </th>
                {canReorder ? (
                  <th scope="col" className="w-10 px-1 py-3">
                    <span className="sr-only">Reorder</span>
                  </th>
                ) : null}
                {config.columns.map((c) => (
                  <th key={c.field} scope="col" className="px-3 py-3 font-semibold">
                    {c.label || <span className="sr-only">{c.field}</span>}
                  </th>
                ))}
                <th scope="col" className="w-12 px-3 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {rows.map((row) => {
                  const href = `/admin/content/${resourceKey}/${row.id}`;
                  const publicUrl = config.publicPath?.(row) ?? null;
                  const isPublished = config.status
                    ? row[config.status.field] === config.status.published
                    : true;
                  return (
                    <SortableRow key={row.id} row={row} enabled={canReorder}>
                      {(handle) => (
                        <>
                          <td className="px-3 py-2.5">
                            <Checkbox
                              aria-label={`Select ${String(row[config.titleField] ?? "")}`}
                              checked={selected.has(row.id)}
                              onCheckedChange={(c) =>
                                setSelected((prev) => {
                                  const n = new Set(prev);
                                  if (c === true) n.add(row.id);
                                  else n.delete(row.id);
                                  return n;
                                })
                              }
                            />
                          </td>
                          {canReorder ? <td className="px-1 py-2.5">{handle}</td> : null}
                          {config.columns.map((c, i) => (
                            <td key={c.field} className="px-3 py-2.5 align-middle">
                              {i === 0 || (i === 1 && config.columns[0].type === "image") ? (
                                c.type === "image" ? (
                                  <Cell col={c} row={row} resourceKey={resourceKey} onToggle={() => {}} />
                                ) : (
                                  <Link
                                    href={href}
                                    className="hover:text-primary font-semibold hover:underline"
                                  >
                                    <Cell col={c} row={row} resourceKey={resourceKey} onToggle={() => {}} />
                                    {config.subtitleField && getPath(row, config.subtitleField) ? (
                                      <span className="text-muted-foreground block text-xs font-normal">
                                        {String(getPath(row, config.subtitleField))}
                                      </span>
                                    ) : null}
                                  </Link>
                                )
                              ) : (
                                <Cell
                                  col={c}
                                  row={row}
                                  resourceKey={resourceKey}
                                  onToggle={(field, v) =>
                                    run(() => toggleBoolean(resourceKey, row.id, field, v))
                                  }
                                />
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-2.5 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon-sm" variant="ghost" aria-label="More actions">
                                  <Ellipsis aria-hidden />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={href}>
                                    <Pencil /> Edit
                                  </Link>
                                </DropdownMenuItem>
                                {config.previewable ? (
                                  <DropdownMenuItem asChild>
                                    <Link href={`/preview/${resourceKey}/${row.id}`} target="_blank">
                                      <Eye /> Preview
                                    </Link>
                                  </DropdownMenuItem>
                                ) : null}
                                {publicUrl && isPublished ? (
                                  <DropdownMenuItem asChild>
                                    <Link href={publicUrl} target="_blank">
                                      <ExternalLink /> View on website
                                    </Link>
                                  </DropdownMenuItem>
                                ) : null}
                                {config.status ? (
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      run(() =>
                                        setRecordsStatus(
                                          resourceKey,
                                          [row.id],
                                          isPublished ? config.status!.draft : config.status!.published,
                                        ),
                                      )
                                    }
                                  >
                                    {isPublished ? <Undo2 /> : <Send />}{" "}
                                    {isPublished ? "Unpublish" : "Publish"}
                                  </DropdownMenuItem>
                                ) : null}
                                {config.canCreate !== false ? (
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      start(async () => {
                                        const res = await duplicateRecord(resourceKey, row.id);
                                        if (!res.ok) return void toast.error(res.message);
                                        toast.success(res.message);
                                        router.push(`/admin/content/${resourceKey}/${res.data!.id}`);
                                      })
                                    }
                                  >
                                    <Copy /> Duplicate
                                  </DropdownMenuItem>
                                ) : null}
                                {config.canDelete !== false ? (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      destructive
                                      onSelect={() => {
                                        if (
                                          window.confirm(
                                            `Delete "${String(row[config.titleField] ?? "this item")}"? A copy is kept in version history.`,
                                          )
                                        )
                                          run(() => deleteRecords(resourceKey, [row.id]));
                                      }}
                                    >
                                      <Trash2 /> Delete
                                    </DropdownMenuItem>
                                  </>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </>
                      )}
                    </SortableRow>
                  );
                })}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
        {!rows.length ? (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold">
              {filtering ? "Nothing matches your filters." : `No ${config.label.toLowerCase()} yet.`}
            </p>
            {config.canCreate !== false && !filtering ? (
              <Button asChild className="mt-4">
                <Link href={`/admin/content/${resourceKey}/new`}>
                  <Plus aria-hidden /> Add {config.singular.toLowerCase()}
                </Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      {canReorder && rows.length > 1 ? (
        <p className="text-muted-foreground text-xs">
          Drag rows by the handle (or focus it and use the arrow keys) to change the order on the website.
        </p>
      ) : null}
    </div>
  );
}
