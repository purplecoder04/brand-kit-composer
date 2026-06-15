import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { buildHowToKitGuide, loadHowToKitSource, type HowToKitGuide } from "@/lib/how-to-kit";

export const Route = createFileRoute("/how-to-kit-print")({
  head: () => ({ meta: [{ title: "How To Use This Kit Print | Kit Factory" }] }),
  component: HowToKitPrintRoute,
});

function HowToKitPrintRoute() {
  const source = useMemo(() => loadHowToKitSource(), []);
  const guide = useMemo(() => (source ? buildHowToKitGuide(source) : null), [source]);

  if (!guide) {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
        How-To PDF not found.{" "}
        <Link to="/how-to-kit" style={{ color: "#4F2D68", textDecoration: "underline" }}>
          Go back to How To Use This Kit
        </Link>
      </div>
    );
  }

  return <HowToKitPrintDocument guide={guide} />;
}

function HowToKitPrintDocument({ guide }: { guide: HowToKitGuide }) {
  const pages = [
    { key: "cover", content: <CoverPage guide={guide} /> },
    { key: "welcome", content: <WelcomePage guide={guide} /> },
    { key: "inside", content: <InsidePage guide={guide} /> },
    { key: "steps", content: <StepsPage /> },
    { key: "finish", content: <FinishPage /> },
  ];

  return (
    <div className="print-stack" style={{ background: "#EFE9DD", minHeight: "100vh" }}>
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

function GuidePage({
  guide,
  pageNumber,
  totalPages,
  children,
}: {
  guide: HowToKitGuide;
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
      <div style={{ position: "absolute", inset: "0.6in", bottom: "1.05in", overflow: "hidden" }}>
        {children}
      </div>
      <div style={{ position: "absolute", left: "0.6in", right: "0.6in", bottom: "0.6in" }}>
        <div
          style={{ height: "1px", background: profile.lineAccentColor, marginBottom: "0.12in" }}
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
          <span>{profile.footerLabel} | How To Use This Kit</span>
          <span>
            {pageNumber} / {totalPages}
          </span>
        </div>
      </div>
    </div>
  );
}

function CoverPage({ guide }: { guide: HowToKitGuide }) {
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
        Customer Instruction Document
      </div>
      <h1
        style={{
          marginTop: "0.18in",
          fontFamily: "var(--font-display, Georgia, serif)",
          fontSize: "52px",
          lineHeight: 0.95,
          color: profile.primaryColor,
        }}
      >
        How To Use This Kit
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

function WelcomePage({ guide }: { guide: HowToKitGuide }) {
  return (
    <PageSection title="Welcome">
      <p style={paragraphStyle}>
        This kit is here to help you work through {guide.kitName || "your workbook"} with more
        clarity and less overwhelm. You can move through it quickly or use it over a few sessions.
        The best pace is the one that helps you think clearly and take the next honest step.
      </p>
      <InfoGrid
        items={[
          ["Kit", guide.kitName || "-"],
          ["Branch", guide.branch || "Brand"],
          ["Audience", guide.audience || "-"],
          ["Tone", guide.tone || "-"],
          ["Pages", String(guide.pageCount)],
          ["Lessons", String(guide.lessonCount)],
          ["Workbook / Activity Pages", String(guide.activityPageCount)],
        ]}
      />
    </PageSection>
  );
}

function InsidePage({ guide }: { guide: HowToKitGuide }) {
  return (
    <PageSection title="What’s Inside">
      {guide.inside.length === 0 ? (
        <p style={paragraphStyle}>This kit is ready for your workbook content.</p>
      ) : (
        <div style={{ display: "grid", gap: "0.14in" }}>
          {guide.inside.map((item) => (
            <GuideListItem
              key={item.key}
              title={`${item.label} (${item.count})`}
              body={item.description}
            />
          ))}
        </div>
      )}
    </PageSection>
  );
}

function StepsPage() {
  return (
    <PageSection title="How To Use It">
      <NumberedList
        items={[
          "Start with the first page.",
          "Read each lesson.",
          "Complete each workbook page.",
          "Do not rush the reflection pages.",
          "Use the checklist and action plan pages to choose next steps.",
          "Come back and update answers as needed.",
        ]}
      />
      <h3 style={subheadingStyle}>Suggested Pace</h3>
      <NumberedList
        items={[
          "Quick version: 30-60 minutes.",
          "Deep version: 2-3 sessions.",
          "Live class or workshop version: use with a facilitator.",
        ]}
      />
    </PageSection>
  );
}

function FinishPage() {
  return (
    <PageSection title="What To Do When Finished">
      <NumberedList
        items={[
          "Review your answers.",
          "Choose your top 3 next actions.",
          "Save your completed copy.",
          "Revisit your answers in 30 days.",
          "Check the next recommended Best Collective offer if applicable.",
        ]}
      />
      <h3 style={subheadingStyle}>Support / Notes</h3>
      <p style={paragraphStyle}>
        This kit is for education and planning support. It does not replace legal, tax, financial,
        medical, or therapy advice.
      </p>
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

function GuideListItem({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(80,70,90,0.18)",
        background: "rgba(255,255,255,0.45)",
        padding: "0.16in",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "15px" }}>{title}</div>
      <div style={{ marginTop: "0.06in", fontSize: "11px", lineHeight: 1.45 }}>{body}</div>
    </div>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol
      style={{
        margin: 0,
        paddingLeft: "0.24in",
        display: "grid",
        gap: "0.1in",
        fontSize: "12px",
        lineHeight: 1.45,
      }}
    >
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
  );
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div
      style={{
        marginTop: "0.35in",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0.18in",
      }}
    >
      {items.map(([label, value]) => (
        <div
          key={label}
          style={{ borderBottom: "1px solid rgba(80,70,90,0.16)", paddingBottom: "0.1in" }}
        >
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
          <div style={{ marginTop: "0.04in", fontSize: "12px" }}>{value}</div>
        </div>
      ))}
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

const paragraphStyle = {
  fontSize: "13px",
  lineHeight: 1.55,
  margin: 0,
};

const subheadingStyle = {
  marginTop: "0.35in",
  marginBottom: "0.16in",
  fontSize: "14px",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}
