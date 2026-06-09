import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useKitStore } from "@/lib/kit-store";

export const Route = createFileRoute("/_app/create")({
  head: () => ({ meta: [{ title: "Create Kit | Kit Factory" }] }),
  component: CreateKitPage,
});

function CreateKitPage() {
  const { createKit } = useKitStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    branch: "Brand",
    audience: "",
    tone: "",
    description: "",
    lessonGuide: "",
    workbook: "",
    tracker: "",
  });

  const onChange = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm({ ...form, [k]: e.target.value });

  const onSave = () => {
    const id = createKit(form);
    toast.success("Draft saved");
    navigate({ to: "/builder", search: { kitId: id } });
  };

  return (
    <div className="p-10 max-w-3xl">
      <div
        className="text-[10px] uppercase tracking-[0.28em]"
        style={{ color: "#4F2D68" }}
      >
        New kit
      </div>
      <h1
        className="mt-1 text-4xl"
        style={{ fontFamily: "var(--font-display)", color: "#222026" }}
      >
        Create Kit
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#6b6470" }}>
        Enter the kit content. You will edit pages in the Kit Builder next.
      </p>

      <div className="mt-8 space-y-5">
        <Field label="Kit Name">
          <input className={inputCls} value={form.name} onChange={onChange("name")} />
        </Field>
        <Field label="Branch">
          <select className={inputCls} value={form.branch} onChange={onChange("branch")}>
            <option value="Brand">Brand</option>
          </select>
        </Field>
        <Field label="Audience">
          <input className={inputCls} value={form.audience} onChange={onChange("audience")} />
        </Field>
        <Field label="Tone">
          <input className={inputCls} value={form.tone} onChange={onChange("tone")} />
        </Field>
        <Field label="Kit Description">
          <textarea className={textareaCls} rows={3} value={form.description} onChange={onChange("description")} />
        </Field>
        <Field label="Lesson Guide Content">
          <textarea className={textareaCls} rows={3} value={form.lessonGuide} onChange={onChange("lessonGuide")} />
        </Field>
        <Field label="Workbook Content">
          <textarea className={textareaCls} rows={3} value={form.workbook} onChange={onChange("workbook")} />
        </Field>
        <Field label="Tracker Content">
          <textarea className={textareaCls} rows={3} value={form.tracker} onChange={onChange("tracker")} />
        </Field>

        <div className="pt-2">
          <button
            onClick={onSave}
            className="rounded-md px-5 py-2.5 text-sm font-medium text-white"
            style={{ background: "#4F2D68" }}
          >
            Save Draft
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4F2D68]/30";
const textareaCls =
  "w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4F2D68]/30 leading-relaxed";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div
        className="mb-1.5 text-[10px] uppercase tracking-[0.18em]"
        style={{ color: "#4F2D68" }}
      >
        {label}
      </div>
      <div style={{ borderColor: "#D8CEC2" }}>{children}</div>
    </label>
  );
}