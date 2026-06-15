import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ExternalLink, FileText, Library, Printer, RefreshCw } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadBuilderDraft, saveBuilderDraft } from "@/lib/builder-content";
import {
  buildHowToKitGuide,
  loadHowToKitSource,
  saveHowToKitRecord,
  saveHowToKitSource,
} from "@/lib/how-to-kit";

export const Route = createFileRoute("/_app/how-to-kit")({
  head: () => ({ meta: [{ title: "How To Use This Kit | Kit Factory" }] }),
  component: HowToKitPage,
});

function HowToKitPage() {
  const navigate = useNavigate();
  const [source, setSource] = useState(() => loadHowToKitSource());
  const guide = useMemo(() => (source ? buildHowToKitGuide(source) : null), [source]);

  const refreshFromBuilder = () => {
    const draft = loadBuilderDraft();
    if (!draft) {
      toast.error("No Builder draft found");
      return;
    }

    const savedDraft = saveBuilderDraft(draft);
    const next = saveHowToKitSource(savedDraft, "Current Builder Draft");
    setSource(next);
    toast.success("How-To PDF regenerated from Builder");
  };

  const openPrintGuide = () => {
    if (!source) return;
    window.open("/how-to-kit-print", "_blank", "noopener,noreferrer");
  };

  const saveGuideToLibrary = () => {
    if (!source) return;
    saveHowToKitRecord(source);
    toast.success("How-To PDF saved to library");
  };

  return (
    <div className="p-8">
      <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#4F2D68" }}>
        Customer Instruction Export
      </div>
      <h1 className="mt-1 text-4xl" style={{ fontFamily: "var(--font-display)", color: "#222026" }}>
        How To Use This Kit
      </h1>
      <p className="mt-2 max-w-3xl text-sm" style={{ color: "#6b6470" }}>
        Generate a simple customer-facing instruction PDF from the current Builder draft or a saved
        Version Library kit. This does not change the workbook pages.
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
          <Printer className="mr-2 h-4 w-4" /> Print / Save How-To PDF
        </Button>
        <Button onClick={saveGuideToLibrary} disabled={!guide} variant="outline">
          <Library className="mr-2 h-4 w-4" /> Save How-To to Library
        </Button>
        <Button onClick={() => navigate({ to: "/package-export" })} variant="outline">
          <ExternalLink className="mr-2 h-4 w-4" /> Back to Package Export
        </Button>
      </div>

      {!guide ? (
        <Card>
          <CardContent className="p-6 text-sm" style={{ color: "#6b6470" }}>
            No How-To source is loaded yet. Open Builder, Version Library, or Package Export and
            click Generate How-To PDF.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <SummaryCard title="Kit" value={guide.kitName || "Untitled"} />
            <SummaryCard title="Branch" value={guide.branch || "Brand"} />
            <SummaryCard title="Pages" value={String(guide.pageCount)} />
            <SummaryCard title="Lessons" value={String(guide.lessonCount)} />
            <SummaryCard title="Activity Pages" value={String(guide.activityPageCount)} />
          </aside>

          <main className="space-y-6">
            <GuideCard title="Welcome">
              <p className="text-sm leading-6" style={{ color: "#3b343f" }}>
                This kit is designed to help you move through the workbook with clarity and a simple
                plan. Start at the beginning, take your time with the writing pages, and use each
                activity to make your next step easier to see.
              </p>
            </GuideCard>

            <GuideCard title="What’s Inside">
              {guide.inside.length === 0 ? (
                <EmptyLine text="No workbook sections were found yet." />
              ) : (
                <div className="space-y-3">
                  {guide.inside.map((item) => (
                    <div
                      key={item.key}
                      className="rounded-md border p-4"
                      style={{ borderColor: "#D8CEC2", background: "#fff" }}
                    >
                      <div className="font-semibold" style={{ color: "#222026" }}>
                        {item.label} ({item.count})
                      </div>
                      <div className="mt-1 text-sm" style={{ color: "#6b6470" }}>
                        {item.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GuideCard>

            <GuideCard title="How To Use It">
              <StepList
                items={[
                  "Start with the first page.",
                  "Read each lesson.",
                  "Complete each workbook page.",
                  "Do not rush the reflection pages.",
                  "Use the checklist and action plan pages to choose next steps.",
                  "Come back and update your answers as needed.",
                ]}
              />
            </GuideCard>

            <GuideCard title="Suggested Pace">
              <StepList
                items={[
                  "Quick version: 30-60 minutes.",
                  "Deep version: 2-3 sessions.",
                  "Live class or workshop version: use with a facilitator.",
                ]}
              />
            </GuideCard>

            <GuideCard title="What To Do When Finished">
              <StepList
                items={[
                  "Review your answers.",
                  "Choose your top 3 next actions.",
                  "Save your completed copy.",
                  "Revisit your answers in 30 days.",
                  "Check the next recommended Best Collective offer if applicable.",
                ]}
              />
            </GuideCard>

            <GuideCard title="Support / Notes">
              <p className="text-sm leading-6" style={{ color: "#3b343f" }}>
                This kit is for education and planning support. It does not replace legal, tax,
                financial, medical, or therapy advice.
              </p>
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

function StepList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2 text-sm" style={{ color: "#3b343f" }}>
      {items.map((item, index) => (
        <li key={item}>
          <span className="mr-2 font-semibold" style={{ color: "#4F2D68" }}>
            {index + 1}.
          </span>
          {item}
        </li>
      ))}
    </ol>
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
