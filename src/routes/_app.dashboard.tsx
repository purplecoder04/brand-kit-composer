import { createFileRoute, Link } from "@tanstack/react-router";
import { useKitStore } from "@/lib/kit-store";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | Kit Factory" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { state } = useKitStore();
  const kits = state.kits;
  const stats = [
    { label: "Total Kits", value: kits.length },
    { label: "Draft Kits", value: kits.filter((k) => k.status === "Draft").length },
    { label: "QC Needed", value: kits.filter((k) => k.qcStatus === "Needs Review").length },
    { label: "Sale Ready", value: kits.filter((k) => k.status === "Sale Ready").length },
    { label: "DocHub Ready", value: kits.filter((k) => k.dochubStatus === "Ready").length },
  ];

  return (
    <div className="p-10 max-w-7xl">
      <PageHeading
        eyebrow="Overview"
        title="Dashboard"
        description="A read-only snapshot of every kit in production."
      />

      <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border p-5"
            style={{ borderColor: "#D8CEC2", background: "#FAF6F0" }}
          >
            <div
              className="text-[10px] uppercase tracking-[0.22em]"
              style={{ color: "#4F2D68" }}
            >
              {s.label}
            </div>
            <div
              className="mt-2 text-3xl"
              style={{
                fontFamily: "var(--font-display)",
                color: "#222026",
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-10 rounded-lg border overflow-hidden"
        style={{ borderColor: "#D8CEC2", background: "#FAF6F0" }}
      >
        <div
          className="px-5 py-3 text-[10px] uppercase tracking-[0.22em]"
          style={{ color: "#4F2D68", borderBottom: "1px solid #D8CEC2" }}
        >
          Kits
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-left"
              style={{ color: "#6b6470", background: "#F4EFE6" }}
            >
              <Th>Kit Name</Th>
              <Th>Branch</Th>
              <Th>Version</Th>
              <Th>Status</Th>
              <Th>QC</Th>
              <Th>DocHub</Th>
              <Th>Updated</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {kits.map((k) => (
              <tr key={k.id} style={{ borderTop: "1px solid #E7DFD2" }}>
                <Td>
                  <span style={{ fontWeight: 600 }}>{k.name}</span>
                </Td>
                <Td>{k.branch}</Td>
                <Td>{k.version}</Td>
                <Td><Pill>{k.status}</Pill></Td>
                <Td><Pill tone={k.qcStatus === "Passed" ? "good" : "warn"}>{k.qcStatus}</Pill></Td>
                <Td><Pill tone={k.dochubStatus === "Ready" ? "good" : "muted"}>{k.dochubStatus}</Pill></Td>
                <Td>{k.updatedAt.slice(0, 10)}</Td>
                <Td>
                  <div className="flex gap-3">
                    <Link to="/builder" search={{ kitId: k.id }} className="underline" style={{ color: "#4F2D68" }}>
                      Edit
                    </Link>
                    <Link to="/print-preview" search={{ kitId: k.id }} className="underline" style={{ color: "#4F2D68" }}>
                      Print
                    </Link>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-[10px] uppercase tracking-[0.18em] font-semibold">
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}
function Pill({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "good" | "warn" | "muted";
}) {
  const palette: Record<string, { bg: string; fg: string }> = {
    good: { bg: "#E5EFE3", fg: "#2E5B33" },
    warn: { bg: "#F3E6D5", fg: "#7a4e16" },
    muted: { bg: "#EDE5D7", fg: "#4F2D68" },
  };
  const c = palette[tone];
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] font-semibold"
      style={{ background: c.bg, color: c.fg }}
    >
      {children}
    </span>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <div
        className="text-[10px] uppercase tracking-[0.28em]"
        style={{ color: "#4F2D68" }}
      >
        {eyebrow}
      </div>
      <h1
        className="mt-1 text-4xl"
        style={{ fontFamily: "var(--font-display)", color: "#222026" }}
      >
        {title}
      </h1>
      {description ? (
        <p className="mt-2 text-sm max-w-2xl" style={{ color: "#6b6470" }}>
          {description}
        </p>
      ) : null}
    </div>
  );
}