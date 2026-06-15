import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import {
  buildLessonGuide,
  loadLessonGuideSource,
  type LessonGuide,
  type LessonGuideActivityItem,
  type LessonGuideTeachingItem,
} from "@/lib/lesson-guide";

export const Route = createFileRoute("/lesson-guide-print")({
  head: () => ({ meta: [{ title: "Lesson Guide Print | Kit Factory" }] }),
  component: LessonGuidePrintRoute,
});

function LessonGuidePrintRoute() {
  const source = useMemo(() => loadLessonGuideSource(), []);
  const guide = useMemo(() => (source ? buildLessonGuide(source) : null), [source]);

  if (!guide) {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
        Lesson Guide not found.{" "}
        <Link to="/lesson-guide" style={{ color: "#4F2D68", textDecoration: "underline" }}>
          Go back to Lesson Guide
        </Link>
      </div>
    );
  }

  return <LessonGuidePrintDocument guide={guide} />;
}

function LessonGuidePrintDocument({ guide }: { guide: LessonGuide }) {
  const pages = buildGuidePages(guide);

  return (
    <div
      className="print-stack"
      style={{
        background: "#EFE9DD",
        minHeight: "100vh",
      }}
    >
      <button
        type="button"
        onClick={() => window.print()}
        className="print-only-hide"
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          background: guide.branchProfile.primaryColor,
          color: "#ffffff",
          border: "none",
          borderRadius: "999px",
          padding: "0.6rem 1rem",
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
          cursor: "pointer",
          zIndex: 50,
          fontFamily: "var(--font-body, Inter, sans-serif)",
        }}
      >
        <Printer style={{ width: 14, height: 14 }} /> Print / Save as PDF
      </button>

      <div
        className="print-stack-inner"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5in",
          padding: "0.5in 0",
        }}
      >
        {pages.map((page, index) => (
          <div
            key={page.key}
            className={index < pages.length - 1 ? "print-page page-break" : "print-page"}
          >
            <GuidePage guide={guide} pageNumber={index + 1} totalPages={pages.length}>
              {page.content}
            </GuidePage>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildGuidePages(guide: LessonGuide) {
  return [
    {
      key: "cover",
      content: <CoverPage guide={guide} />,
    },
    {
      key: "overview",
      content: <OverviewPage guide={guide} />,
    },
    ...chunk(guide.teachingFlow, 3).map((items, index) => ({
      key: `teaching-${index}`,
      content: <TeachingPage items={items} offset={index * 3} />,
    })),
    ...chunk(guide.activityMap, 3).map((items, index) => ({
      key: `activity-${index}`,
      content: <ActivityPage items={items} offset={index * 3} />,
    })),
    {
      key: "final",
      content: <FinalNotesPage />,
    },
  ];
}

function GuidePage({
  guide,
  pageNumber,
  totalPages,
  children,
}: {
  guide: LessonGuide;
  pageNumber: number;
  totalPages: number;
  children: ReactNode;
}) {
  const profile = guide.branchProfile;

  return (
    <div
      className="page-canvas"
      style={{
        width: "8.5in",
        height: "11in",
        backgroundColor: profile.backgroundColor,
        color: profile.textColor,
        fontFamily: "var(--font-body, Inter, system-ui, sans-serif)",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "0.6in",
          bottom: "1.05in",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          left: "0.6in",
          right: "0.6in",
          bottom: "0.6in",
          height: "0.45in",
        }}
      >
        <div
          style={{
            height: "1px",
            background: profile.lineAccentColor,
            marginBottom: "0.12in",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: profile.footerBarColor,
          }}
        >
          <span>{profile.footerLabel} | Lesson Guide</span>
          <span>
            {pageNumber} / {totalPages}
          </span>
        </div>
      </div>
    </div>
  );
}

function CoverPage({ guide }: { guide: LessonGuide }) {
  const profile = guide.branchProfile;

  return (
    <div
      style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}
    >
      <div
        style={{
          fontSize: "12px",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: profile.accentColor,
        }}
      >
        Internal Support Document
      </div>
      <h1
        style={{
          marginTop: "0.18in",
          fontFamily: "var(--font-display, Georgia, serif)",
          fontSize: "60px",
          lineHeight: 0.95,
          color: profile.primaryColor,
        }}
      >
        Lesson Guide
      </h1>
      <div
        style={{
          width: "2.6in",
          height: "1px",
          background: profile.lineAccentColor,
          margin: "0.35in 0",
        }}
      />
      <h2
        style={{
          maxWidth: "5.5in",
          fontFamily: "var(--font-display, Georgia, serif)",
          fontSize: "34px",
          lineHeight: 1,
          color: profile.textColor,
        }}
      >
        {guide.kitName || "Untitled Kit"}
      </h2>
      <div style={{ marginTop: "0.25in", display: "grid", gap: "0.12in", fontSize: "13px" }}>
        <MetaLine label="Branch" value={guide.branch || "Brand"} />
        <MetaLine label="Audience" value={guide.audience || "-"} />
        <MetaLine label="Date Generated" value={formatDate(guide.generatedAt)} />
      </div>
    </div>
  );
}

function OverviewPage({ guide }: { guide: LessonGuide }) {
  return (
    <PageSection title="Kit Overview">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.2in" }}>
        <InfoBox label="Kit Name" value={guide.kitName} />
        <InfoBox label="Subtitle" value={guide.subtitle} />
        <InfoBox label="Branch" value={guide.branch} />
        <InfoBox label="Audience" value={guide.audience} />
        <InfoBox label="Tone" value={guide.tone} />
        <InfoBox label="Tagline" value={guide.tagline} />
        <InfoBox label="Total Workbook Pages" value={String(guide.totalWorkbookPages)} />
        <InfoBox label="Total Lesson Pages" value={String(guide.totalLessonPages)} />
        <InfoBox label="Workbook / Action Pages" value={String(guide.totalWorkbookActionPages)} />
      </div>
    </PageSection>
  );
}

function TeachingPage({ items, offset }: { items: LessonGuideTeachingItem[]; offset: number }) {
  return (
    <PageSection title="Teaching Flow">
      {items.length === 0 ? (
        <p>No lesson or module pages found.</p>
      ) : (
        <div style={{ display: "grid", gap: "0.18in" }}>
          {items.map((item, index) => (
            <GuideListItem
              key={item.id}
              number={offset + index + 1}
              title={item.title}
              label={item.pageTypeLabel}
              lines={[
                ["Summary", item.summary],
                ["Teaching Note", item.teachingNote],
                ["Discussion Question", item.discussionQuestion],
                ["Action Step", item.actionStep],
              ]}
            />
          ))}
        </div>
      )}
    </PageSection>
  );
}

function ActivityPage({ items, offset }: { items: LessonGuideActivityItem[]; offset: number }) {
  return (
    <PageSection title="Workbook Activity Map">
      {items.length === 0 ? (
        <p>No workbook activity pages found.</p>
      ) : (
        <div style={{ display: "grid", gap: "0.18in" }}>
          {items.map((item, index) => (
            <GuideListItem
              key={item.id}
              number={offset + index + 1}
              title={item.title}
              label={item.pageTypeLabel}
              lines={[
                ["Prompt", item.prompt],
                ["Suggested User Outcome", item.suggestedOutcome],
                ["Notes for Facilitator", item.facilitatorNotes],
              ]}
            />
          ))}
        </div>
      )}
    </PageSection>
  );
}

function FinalNotesPage() {
  return (
    <PageSection title="Final Notes">
      <GuideListItem
        number={1}
        title="Suggested way to use the kit"
        label="Facilitator note"
        lines={[["Note", "Move through the kit in order, pausing after each activity page."]]}
      />
      <GuideListItem
        number={2}
        title="Suggested live class or self-study use"
        label="Delivery note"
        lines={[
          [
            "Note",
            "For live classes, teach one lesson/module at a time. For self-study, invite the buyer to complete each action page before moving forward.",
          ],
        ]}
      />
      <GuideListItem
        number={3}
        title="Suggested next step for the buyer"
        label="Closing note"
        lines={[
          [
            "Note",
            "Review completed pages, choose one practical next action, and save the workbook as a reference.",
          ],
        ]}
      />
    </PageSection>
  );
}

function PageSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display, Georgia, serif)",
          fontSize: "34px",
          lineHeight: 1,
          color: "inherit",
        }}
      >
        {title}
      </h2>
      <div
        style={{ marginTop: "0.12in", height: "1px", background: "currentColor", opacity: 0.22 }}
      />
      <div style={{ marginTop: "0.25in" }}>{children}</div>
    </section>
  );
}

function GuideListItem({
  number,
  title,
  label,
  lines,
}: {
  number: number;
  title: string;
  label: string;
  lines: Array<[string, string]>;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(80,70,90,0.18)",
        background: "rgba(255,255,255,0.45)",
        padding: "0.16in",
      }}
    >
      <div style={{ display: "flex", gap: "0.12in", alignItems: "baseline" }}>
        <strong style={{ fontSize: "12px" }}>{number}.</strong>
        <div>
          <div style={{ fontWeight: 700, fontSize: "15px" }}>{title || "-"}</div>
          <div
            style={{
              marginTop: "0.03in",
              fontSize: "9px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              opacity: 0.7,
            }}
          >
            {label}
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: "0.1in",
          display: "grid",
          gap: "0.06in",
          fontSize: "11px",
          lineHeight: 1.38,
        }}
      >
        {lines.map(([lineLabel, value]) => (
          <div key={lineLabel}>
            <strong>{lineLabel}: </strong>
            {value || "-"}
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderBottom: "1px solid rgba(80,70,90,0.16)", paddingBottom: "0.12in" }}>
      <div
        style={{
          fontSize: "9px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          opacity: 0.7,
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: "0.04in", fontSize: "12px", lineHeight: 1.35 }}>{value || "-"}</div>
    </div>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <strong>{label}: </strong>
      {value}
    </div>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}
