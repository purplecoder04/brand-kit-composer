import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CheckCircle2, LockKeyhole, Palette, Shapes } from "lucide-react";
import { BRANCH_TEMPLATE_PROFILES } from "@/lib/branch-profile";

export const Route = createFileRoute("/_app/templates")({
  head: () => ({ meta: [{ title: "Branch Templates | Kit Factory" }] }),
  component: BranchTemplatesPage,
});

const SHARED_PAGE_TYPES = [
  "Cover",
  "Section Divider",
  "Lesson Page",
  "Table / Tracker Page",
  "Workbook Page",
  "Checklist Page",
  "Notes Page",
  "Back Cover",
  "Start Here Page",
  "Module Intro Page",
  "Quote / Opening Thought Page",
  "Reflection Page",
  "Action Plan Page",
  "Resource Page",
  "Case Study / Example Page",
  "Prompt Page",
  "Progress Check Page",
  "Closing / Next Steps Page",
];

function BranchTemplatesPage() {
  return (
    <div className="p-10">
      <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#4F2D68" }}>
        Production control room
      </div>
      <h1 className="mt-1 text-4xl" style={{ fontFamily: "var(--font-display)", color: "#222026" }}>
        Branch Templates
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "#6b6470" }}>
        Branch Templates controls which approved template system each Best Collective branch uses.
        Workbook content, page building, and layout redesign stay in the builder and locked template
        system.
      </p>

      <div className="mt-8 grid gap-4 lg:grid-cols-3 2xl:grid-cols-5">
        {BRANCH_TEMPLATE_PROFILES.map((profile) => (
          <section
            key={profile.name}
            className="rounded-md border p-5"
            style={{ borderColor: "#D8CEC2", background: "#FAF6F0" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div
                  className="text-[10px] uppercase tracking-[0.24em]"
                  style={{ color: profile.primaryColor }}
                >
                  {profile.branchLabel}
                </div>
                <h2
                  className="mt-1 text-2xl"
                  style={{ fontFamily: "var(--font-display)", color: "#222026" }}
                >
                  {profile.displayName}
                </h2>
                {profile.displayName !== profile.name ? (
                  <div className="mt-1 text-xs" style={{ color: "#6b6470" }}>
                    Branch: {profile.name}
                  </div>
                ) : null}
              </div>
              <span
                className="rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em]"
                style={{
                  borderColor: profile.goldAccent,
                  color: profile.primaryColor,
                  background: "#fff",
                }}
              >
                {profile.status}
              </span>
            </div>

            <div className="mt-5 space-y-3 text-sm" style={{ color: "#4d4651" }}>
              <InfoRow icon={<Shapes className="h-4 w-4" />} label="Structure">
                {profile.templateStructure}
              </InfoRow>
              <InfoRow icon={<LockKeyhole className="h-4 w-4" />} label="Control">
                Locked shared engine
              </InfoRow>
              <InfoRow icon={<Palette className="h-4 w-4" />} label="Colors">
                {profile.colorProfilePlaceholder}
              </InfoRow>
              <InfoRow icon={<Shapes className="h-4 w-4" />} label="Mood">
                {profile.mood}
              </InfoRow>
            </div>

            <div className="mt-5 grid gap-2" aria-label={`${profile.name} color profile`}>
              {profile.colorSwatches.map((swatch) => (
                <div key={`${swatch.label}-${swatch.color}`} className="flex items-center gap-2">
                  <span
                    className="h-6 w-6 shrink-0 rounded-sm border"
                    style={{ background: swatch.color, borderColor: "#D8CEC2" }}
                  />
                  <span className="text-xs" style={{ color: "#4d4651" }}>
                    {swatch.label}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="mt-5 rounded-md border px-3 py-2 text-xs"
              style={{ borderColor: "#D8CEC2", background: "#fff", color: "#6b6470" }}
            >
              Footer label: <span style={{ color: "#222026" }}>{profile.footerLabel}</span>
            </div>
            <div
              className="mt-2 rounded-md border px-3 py-2 text-xs"
              style={{ borderColor: "#D8CEC2", background: "#fff", color: "#6b6470" }}
            >
              Decorative weight: <span style={{ color: "#222026" }}>{profile.shapeWeight}</span>
            </div>
            <div
              className="mt-2 rounded-md border px-3 py-2 text-xs"
              style={{ borderColor: "#D8CEC2", background: "#fff", color: "#6b6470" }}
            >
              Cover path: <span style={{ color: "#222026" }}>{profile.coverImagePath}</span>
            </div>
          </section>
        ))}
      </div>

      <section
        className="mt-8 rounded-md border p-6"
        style={{ borderColor: "#D8CEC2", background: "#FAF6F0" }}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" style={{ color: "#4F2D68" }} />
          <h2 className="text-xl" style={{ fontFamily: "var(--font-display)", color: "#222026" }}>
            Shared workbook engine
          </h2>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: "#6b6470" }}>
          Every branch uses the same approved page system. Branch selection changes the branch
          identity applied to preview and PDF export; it does not create a separate page builder.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {SHARED_PAGE_TYPES.map((pageType) => (
            <span
              key={pageType}
              className="rounded-full border px-3 py-1 text-xs"
              style={{ borderColor: "#D8CEC2", background: "#fff", color: "#4F2D68" }}
            >
              {pageType}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5" style={{ color: "#4F2D68" }}>
        {icon}
      </span>
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "#4F2D68" }}>
          {label}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
