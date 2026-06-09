import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Save, GitBranch, Printer } from "lucide-react";
import { useKitStore } from "@/lib/kit-store";
import { PageRenderer } from "@/components/PageRenderer";
import { PagePreview } from "@/components/PagePreview";
import type { Block, PageType } from "@/lib/kit-types";

const searchSchema = z.object({
  kitId: z.string().optional(),
});

export const Route = createFileRoute("/_app/builder")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Kit Builder | Kit Factory" }] }),
  component: BuilderPage,
});

function BuilderPage() {
  const search = Route.useSearch();
  const { state, updateBlock, addBlock, removeBlock, saveVersion, updateKit } = useKitStore();
  const navigate = useNavigate();

  const kit = useMemo(() => {
    if (search.kitId) return state.kits.find((k) => k.id === search.kitId) ?? state.kits[0];
    return state.kits[0];
  }, [search.kitId, state.kits]);

  if (!kit) return <div className="p-10">No kits yet.</div>;

  return (
    <div className="flex h-screen">
      {/* Left: editor */}
      <div
        className="w-[520px] shrink-0 overflow-y-auto p-6 border-r"
        style={{ borderColor: "#D8CEC2", background: "#FAF6F0" }}
      >
        <div
          className="text-[10px] uppercase tracking-[0.28em]"
          style={{ color: "#4F2D68" }}
        >
          Kit Builder
        </div>

        <div className="mt-1 flex items-baseline gap-3">
          <select
            value={kit.id}
            onChange={(e) =>
              navigate({ to: "/builder", search: { kitId: e.target.value } })
            }
            className="text-2xl bg-transparent outline-none"
            style={{ fontFamily: "var(--font-display)", color: "#4F2D68" }}
          >
            {state.kits.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-1 text-xs" style={{ color: "#6b6470" }}>
          {kit.branch} | {kit.version} | {kit.blocks.length} pages
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/print-preview"
            search={{ kitId: kit.id }}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-white"
            style={{ background: "#4F2D68" }}
          >
            <Printer className="h-3.5 w-3.5" /> Open Print Preview
          </Link>
          <button
            onClick={() => {
              saveVersion(kit.id, "Snapshot from Kit Builder");
              toast.success("Version saved");
            }}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium"
            style={{ borderColor: "#4F2D68", color: "#4F2D68" }}
          >
            <GitBranch className="h-3.5 w-3.5" /> Save Version
          </button>
          <button
            onClick={() => {
              updateKit(kit.id, {});
              toast.success("Draft saved");
            }}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium"
            style={{ borderColor: "#D8CEC2", color: "#4F2D68" }}
          >
            <Save className="h-3.5 w-3.5" /> Save Draft
          </button>
        </div>

        <div className="mt-7 space-y-4">
          {kit.blocks.map((b) => (
            <BlockEditor
              key={b.id}
              block={b}
              onChange={(patch) => updateBlock(kit.id, b.id, patch)}
              onRemove={() => removeBlock(kit.id, b.id)}
            />
          ))}
        </div>

        <AddBlockMenu onAdd={(t) => addBlock(kit.id, t)} />
      </div>

      {/* Right: live preview stack */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ background: "#EFE9DD" }}
      >
        <div className="mx-auto max-w-[5.5in] py-10 space-y-8">
          {kit.blocks.map((b, i) => (
            <PagePreview key={b.id} scale={0.6}>
              <PageRenderer
                block={b}
                branchProfile={kit.branchProfile}
                pageNumber={i + 1}
                totalPages={kit.blocks.length}
              />
            </PagePreview>
          ))}
        </div>
      </div>
    </div>
  );
}

function BlockEditor({
  block,
  onChange,
  onRemove,
}: {
  block: Block;
  onChange: (patch: Partial<Block>) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="rounded-md border p-4 bg-white"
      style={{ borderColor: "#D8CEC2" }}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-full"
          style={{ background: "#EDE5D7", color: "#4F2D68" }}
        >
          #{block.order}
        </span>
        <select
          value={block.pageType}
          onChange={(e) => onChange({ pageType: e.target.value as PageType })}
          className="text-xs border rounded px-2 py-1"
          style={{ borderColor: "#D8CEC2" }}
        >
          <option value="cover">Cover</option>
          <option value="divider">Section Divider</option>
          <option value="lesson">Lesson</option>
          <option value="table">Table</option>
          <option value="workbook">Workbook</option>
        </select>
        <input
          type="number"
          value={block.order}
          onChange={(e) => onChange({ order: Number(e.target.value) || 1 })}
          className="ml-auto w-14 text-xs border rounded px-2 py-1"
          style={{ borderColor: "#D8CEC2" }}
        />
        <button
          onClick={onRemove}
          className="rounded p-1.5 hover:bg-[#F4EFE6]"
          aria-label="Remove block"
        >
          <Trash2 className="h-3.5 w-3.5" color="#7a1f1f" />
        </button>
      </div>

      <div className="mt-3 space-y-2">
        <Input label="Title" value={block.title} onChange={(v) => onChange({ title: v })} />
        <Input
          label="Subtitle"
          value={block.subtitle ?? ""}
          onChange={(v) => onChange({ subtitle: v })}
        />
        {(block.pageType === "cover" ||
          block.pageType === "lesson" ||
          block.pageType === "divider") && (
          <Textarea
            label="Body"
            value={block.body ?? ""}
            onChange={(v) => onChange({ body: v })}
            rows={block.pageType === "lesson" ? 6 : 3}
          />
        )}
        {block.pageType === "workbook" && (
          <>
            <Textarea
              label="Prompt"
              value={block.prompt ?? ""}
              onChange={(v) => onChange({ prompt: v })}
              rows={3}
            />
            <Input
              label="Lines"
              type="number"
              value={String(block.lines ?? 12)}
              onChange={(v) => onChange({ lines: Math.max(4, Math.min(20, Number(v) || 12)) })}
            />
          </>
        )}
        {block.pageType === "table" && (
          <TableEditor
            value={block.tableData ?? { headers: [], rows: [] }}
            onChange={(t) => onChange({ tableData: t })}
          />
        )}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <div
        className="mb-1 text-[10px] uppercase tracking-[0.16em]"
        style={{ color: "#6b6470" }}
      >
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border px-2.5 py-1.5 text-sm"
        style={{ borderColor: "#D8CEC2" }}
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <div
        className="mb-1 text-[10px] uppercase tracking-[0.16em]"
        style={{ color: "#6b6470" }}
      >
        {label}
      </div>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border px-2.5 py-1.5 text-sm leading-relaxed"
        style={{ borderColor: "#D8CEC2" }}
      />
    </label>
  );
}

function TableEditor({
  value,
  onChange,
}: {
  value: { headers: string[]; rows: string[][] };
  onChange: (v: { headers: string[]; rows: string[][] }) => void;
}) {
  return (
    <div>
      <div
        className="mb-1 text-[10px] uppercase tracking-[0.16em]"
        style={{ color: "#6b6470" }}
      >
        Table
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr>
            {value.headers.map((h, i) => (
              <th key={i} className="p-1">
                <input
                  value={h}
                  onChange={(e) => {
                    const headers = [...value.headers];
                    headers[i] = e.target.value;
                    onChange({ ...value, headers });
                  }}
                  className="w-full rounded border px-1.5 py-1 text-xs"
                  style={{ borderColor: "#D8CEC2", background: "#F4EFE6" }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {value.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="p-1">
                  <input
                    value={cell}
                    onChange={(e) => {
                      const rows = value.rows.map((r) => [...r]);
                      rows[ri][ci] = e.target.value;
                      onChange({ ...value, rows });
                    }}
                    className="w-full rounded border px-1.5 py-1 text-xs"
                    style={{ borderColor: "#D8CEC2" }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex gap-2">
        <button
          onClick={() =>
            onChange({
              ...value,
              rows: [...value.rows, value.headers.map(() => "")],
            })
          }
          className="text-[11px] rounded border px-2 py-1"
          style={{ borderColor: "#D8CEC2", color: "#4F2D68" }}
        >
          + Row
        </button>
        <button
          onClick={() =>
            value.rows.length > 1 &&
            onChange({ ...value, rows: value.rows.slice(0, -1) })
          }
          className="text-[11px] rounded border px-2 py-1"
          style={{ borderColor: "#D8CEC2", color: "#7a1f1f" }}
        >
          - Row
        </button>
      </div>
    </div>
  );
}

function AddBlockMenu({ onAdd }: { onAdd: (t: PageType) => void }) {
  const opts: { t: PageType; label: string }[] = [
    { t: "cover", label: "Cover" },
    { t: "divider", label: "Section Divider" },
    { t: "lesson", label: "Lesson" },
    { t: "table", label: "Table" },
    { t: "workbook", label: "Workbook" },
  ];
  return (
    <div
      className="mt-5 rounded-md border p-3"
      style={{ borderColor: "#D8CEC2", background: "#F4EFE6" }}
    >
      <div
        className="mb-2 text-[10px] uppercase tracking-[0.18em]"
        style={{ color: "#4F2D68" }}
      >
        Add block
      </div>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => (
          <button
            key={o.t}
            onClick={() => onAdd(o.t)}
            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs"
            style={{ borderColor: "#D8CEC2", background: "#fff", color: "#4F2D68" }}
          >
            <Plus className="h-3 w-3" /> {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}