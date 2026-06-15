import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ExternalLink, FileText, Library, Printer, RefreshCw } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadBuilderDraft, saveBuilderDraft } from "@/lib/builder-content";
import {
  buildLessonGuide,
  loadLessonGuideSource,
  saveLessonGuideRecord,
  saveLessonGuideSource,
  type LessonGuide,
} from "@/lib/lesson-guide";

export const Route = createFileRoute("/_app/lesson-guide")({
  head: () => ({ meta: [{ title: "Lesson Guide | Kit Factory" }] }),
  component: LessonGuidePage,
});

function LessonGuidePage() {
  const navigate = useNavigate();
  const [source, setSource] = useState(() => loadLessonGuideSource());
  const guide = useMemo(() => (source ? buildLessonGuide(source) : null), [source]);

  const refreshFromBuilder = () => {
    const draft = loadBuilderDraft();
    if (!draft) {
      toast.error("No Builder draft found");
      return;
    }

    const savedDraft = saveBuilderDraft(draft);
    const next = saveLessonGuideSource(savedDraft, "Current Builder Draft");
    setSource(next);
    toast.success("Lesson Guide regenerated from Builder");
  };

  const openPrintGuide = () => {
    if (!source) return;
    window.open("/lesson-guide-print", "_blank", "noopener,noreferrer");
  };

  const saveGuideToLibrary = () => {
    if (!source) return;
    saveLessonGuideRecord(source);
    toast.success("Lesson Guide saved to library");
  };

  return (
    <div className="p-8">
      <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#4F2D68" }}>
        Internal Support Export
      </div>
      <h1 className="mt-1 text-4xl" style={{ fontFamily: "var(--font-display)", color: "#222026" }}>
        Lesson Guide
      </h1>
      <p className="mt-2 max-w-3xl text-sm" style={{ color: "#6b6470" }}>
        Generate a simple teacher/support guide from the current Builder draft or a saved Version
        Library kit. This does not change the workbook pages.
      </p>

      <div
        className="sticky top-0 z-20 -mx-8 mt-6 mb-6 flex flex-wrap items-center gap-2 border-y px-8 py-3"
        style={{ background: "#FAF6F0", borderColor: "#D8CEC2" }}
      >
        <Button onClick={refreshFromBuilder} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Regenerate from Builder
        </Button>
        <Button
          onClick={openPrintGuide}
          disabled={!guide}
          style={{ background: "#4F2D68", color: "#fff" }}
        >
          <Printer className="mr-2 h-4 w-4" /> Print / Save Lesson Guide
        </Button>
        <Button onClick={saveGuideToLibrary} disabled={!guide} variant="outline">
          <Library className="mr-2 h-4 w-4" /> Save Lesson Guide to Library
        </Button>
        <Button onClick={() => navigate({ to: "/package-export" })} variant="outline">
          <ExternalLink className="mr-2 h-4 w-4" /> Back to Package Export
        </Button>
      </div>

      {!guide ? (
        <Card>
          <CardContent className="p-6 text-sm" style={{ color: "#6b6470" }}>
            No Lesson Guide source is loaded yet. Open Builder, Version Library, or Package Export
            and click Generate Lesson Guide.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <SummaryCard title="Kit" value={guide.kitName || "Untitled"} />
            <SummaryCard title="Branch" value={guide.branch || "Brand"} />
            <SummaryCard title="Workbook Pages" value={String(guide.totalWorkbookPages)} />
            <SummaryCard title="Lesson Pages" value={String(guide.totalLessonPages)} />
            <SummaryCard title="Activity Pages" value={String(guide.totalWorkbookActionPages)} />
          </aside>

          <main className="space-y-6">
            <GuideCard title="Kit Overview">
              <dl className="grid gap-3 md:grid-cols-2">
                <InfoItem label="Kit Name" value={guide.kitName} />
                <InfoItem label="Subtitle" value={guide.subtitle} />
                <InfoItem label="Branch" value={guide.branch} />
                <InfoItem label="Audience" value={guide.audience} />
                <InfoItem label="Tone" value={guide.tone} />
                <InfoItem label="Tagline" value={guide.tagline} />
              </dl>
            </GuideCard>

            <GuideCard title="Teaching Flow">
              {guide.teachingFlow.length === 0 ? (
                <EmptyLine text="No lesson or module pages found yet." />
              ) : (
                <div className="space-y-3">
                  {guide.teachingFlow.map((item, index) => (
                    <PreviewItem
                      key={item.id}
                      index={index + 1}
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
            </GuideCard>

            <GuideCard title="Workbook Activity Map">
              {guide.activityMap.length === 0 ? (
                <EmptyLine text="No workbook activity pages found yet." />
              ) : (
                <div className="space-y-3">
                  {guide.activityMap.map((item, index) => (
                    <PreviewItem
                      key={item.id}
                      index={index + 1}
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
            </GuideCard>

            <GuideCard title="Final Notes">
              <ul className="space-y-2 text-sm" style={{ color: "#3b343f" }}>
                <li>Use this kit by moving through the workbook pages in order.</li>
                <li>For live classes, teach one major lesson or module at a time.</li>
                <li>
                  For self-study, invite the buyer to complete one action page before moving on.
                </li>
                <li>
                  Suggested next step: review the completed workbook and choose one clear action.
                </li>
              </ul>
            </GuideCard>
          </main>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#4F2D68" }}>
          {title}
        </div>
        <div className="mt-2 text-xl font-semibold" style={{ color: "#222026" }}>
          {value || "-"}
        </div>
      </CardContent>
    </Card>
  );
}

function GuideCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base">
          <FileText className="mr-2 h-4 w-4" style={{ color: "#4F2D68" }} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "#4F2D68" }}>
        {label}
      </dt>
      <dd className="mt-1 text-sm" style={{ color: "#222026" }}>
        {value || "-"}
      </dd>
    </div>
  );
}

function PreviewItem({
  index,
  title,
  label,
  lines,
}: {
  index: number;
  title: string;
  label: string;
  lines: Array<[string, string]>;
}) {
  return (
    <div className="rounded-md border p-4" style={{ borderColor: "#D8CEC2", background: "#fff" }}>
      <div className="flex items-baseline gap-3">
        <span className="text-xs font-semibold" style={{ color: "#4F2D68" }}>
          {index}.
        </span>
        <div>
          <div className="font-semibold" style={{ color: "#222026" }}>
            {title}
          </div>
          <div
            className="mt-1 text-[10px] uppercase tracking-[0.16em]"
            style={{ color: "#6b6470" }}
          >
            {label}
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {lines.map(([lineLabel, value]) => (
          <div key={lineLabel} className="text-sm" style={{ color: "#3b343f" }}>
            <span className="font-semibold">{lineLabel}: </span>
            {value || "-"}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <div
      className="rounded-md border px-4 py-3 text-sm"
      style={{ borderColor: "#D8CEC2", color: "#6b6470" }}
    >
      {text}
    </div>
  );
}
