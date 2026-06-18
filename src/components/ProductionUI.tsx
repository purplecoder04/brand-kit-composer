import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <div className="text-[10px] uppercase tracking-[0.24em]" style={{ color: "#6b6470" }}>
            {eyebrow}
          </div>
        ) : null}
        <h1
          className="mt-1 text-3xl"
          style={{ fontFamily: "var(--font-display)", color: "#222026" }}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "#6b6470" }}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div
      className="sticky top-0 z-20 -mx-8 mb-5 flex flex-wrap items-center gap-2 border-y px-8 py-3"
      style={{ background: "#FAF6F0", borderColor: "#D8CEC2" }}
    >
      {children}
    </div>
  );
}

export function ActionGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b6470]">
        {label}
      </span>
      {children}
    </div>
  );
}

export function StatusStrip({ children }: { children: ReactNode }) {
  return (
    <div
      className="mb-6 grid grid-cols-1 gap-2 rounded-md border px-4 py-3 text-xs lg:grid-cols-4"
      style={{ borderColor: "#D8CEC2", background: "#FAF6F0", color: "#4F2D68" }}
    >
      {children}
    </div>
  );
}

export function StatusItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <span className="uppercase tracking-wider opacity-70">{label}: </span>
      <span style={{ color: "#222026" }}>{value || "--"}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div
      className="rounded-md border px-5 py-6 text-sm"
      style={{ borderColor: "#D8CEC2", background: "#FAF6F0", color: "#6b6470" }}
    >
      <div className="font-semibold" style={{ color: "#222026" }}>
        {title}
      </div>
      <div className="mt-1 leading-6">{description}</div>
      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
