import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ProductionUI";

export const Route = createFileRoute("/_app/import-guide")({
  head: () => ({ meta: [{ title: "Import Format Guide | Kit Factory" }] }),
  component: ImportGuidePage,
});

function ImportGuidePage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <Link to="/import">
          <Button type="button" variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Import
          </Button>
        </Link>
      </div>

      <PageHeader
        eyebrow="Reference"
        title="Import Format Guide"
        description="Use this strict format when pasting or uploading content. The importer reads labels line by line and maps them to pages in your kit."
      />

      <div className="mt-8 space-y-6 max-w-3xl">
        <GuideSection title="Kit Header Labels">
          <p className="text-sm mb-3" style={{ color: "#6b6470" }}>
            Place these at the top of your document, before any page labels.
          </p>
          <CodeBlock>{`Kit Name: Your Kit Title
Subtitle: A short description of the kit
Branch: Brand
Audience: Creative entrepreneurs
Tone: Clear and encouraging
Tagline: Build the brand only you can build.`}</CodeBlock>
          <LabelTable
            rows={[
              ["Kit Name:", "The main title of the kit (required)"],
              ["Subtitle:", "A short supporting line under the title"],
              ["Branch:", "Content area: Brand, Business, Lifestyle, etc."],
              ["Audience:", "Who the kit is designed for"],
              ["Tone:", "How the content should sound"],
              ["Tagline:", "A short hook line, often used on the cover"],
            ]}
          />
        </GuideSection>

        <GuideSection title="Page Type Labels">
          <p className="text-sm mb-3" style={{ color: "#6b6470" }}>
            Each label starts a new page. Put the page title after the colon, or leave the title blank and set it with <code className="font-mono text-xs">Title:</code> on the next line.
          </p>
          <LabelTable
            rows={[
              ["Cover: Title", "Front cover page"],
              ["Lesson: Title", "Teaching or reading page"],
              ["Lesson Activity: Title", "Checklist or action-step activity page"],
              ["Workbook: Title", "Fillable writing page with a prompt and lines"],
              ["Prompt Page: Title", "Single fillable prompt page"],
              ["Multi-Prompt Page: Title", "Multiple prompts on one page"],
              ["Checklist: Title", "Printable checklist page"],
              ["Table: Title", "3-column table or tracker"],
              ["Notes: Title", "Open notes page with optional prompt"],
              ["Section: Title", "Section divider with a label"],
              ["Module Intro: Title", "Module overview page"],
              ["Quote: Title", "Quote or opening thought page"],
              ["Reflection Page: Title", "Reflection or deeper thinking page"],
              ["Action Plan: Title", "Action plan layout page"],
              ["Resource: Title", "Resource or reference page"],
              ["Case Study: Title", "Case study or example page"],
              ["Progress Check: Title", "Progress or milestone check-in page"],
              ["Closing: Title", "Closing or next steps page"],
              ["Start Here: Title", "Orientation or welcome page"],
              ["Back Cover:", "Back cover (no title needed)"],
            ]}
          />
        </GuideSection>

        <GuideSection title="Content Labels">
          <p className="text-sm mb-3" style={{ color: "#6b6470" }}>
            These go below a page label to add content to that page. The same label can appear multiple times and the text is joined.
          </p>
          <LabelTable
            rows={[
              ["Title:", "Sets the page title if not included in the page label line"],
              ["Subtitle:", "Adds a subtitle line to a page"],
              ["Body:", "Teaching text for Lesson pages (can repeat)"],
              ["Prompt:", "Question or prompt text for Workbook and Prompt pages"],
              ["Prompt 1: / Prompt 2: …", "Numbered prompts for Multi-Prompt pages"],
              ["Lines: 8", "Number of writing lines (Workbook, Notes, Prompt pages)"],
              ["Headers: Col1, Col2, Col3", "Column headers for Table pages"],
              ["Row: Val1, Val2, Val3", "A data row for Table pages (can repeat)"],
              ["Activity Type: checklist", "Sets the activity type (checklist, action-steps, writing-prompt)"],
              ["Activity Title:", "Title for the checklist or activity section"],
              ["Bottom Note:", "Small note at the bottom of any page"],
            ]}
          />
        </GuideSection>

        <GuideSection title="Checklist Items">
          <p className="text-sm mb-3" style={{ color: "#6b6470" }}>
            Under a <code className="font-mono text-xs">Checklist:</code> or <code className="font-mono text-xs">Lesson Activity:</code> page, list items with a dash or number.
          </p>
          <CodeBlock>{`Checklist: Launch Checklist
- Review the kit
- Export the PDF
- Send to the client`}</CodeBlock>
        </GuideSection>

        <GuideSection title="Separators">
          <p className="text-sm mb-3" style={{ color: "#6b6470" }}>
            Use three or more dashes on their own line to end the current page and start fresh. This is optional — a new page label automatically starts a new page.
          </p>
          <CodeBlock>{`Lesson: First Lesson Title
Body: Lesson content here.

---

Workbook: First Workbook Page
Prompt: What did you learn?`}</CodeBlock>
        </GuideSection>

        <GuideSection title="Multi-Prompt Pages">
          <p className="text-sm mb-3" style={{ color: "#6b6470" }}>
            Use <code className="font-mono text-xs">Multi-Prompt Page:</code> when several short questions should stay together on one page. Use <code className="font-mono text-xs">Prompt Page:</code> (or <code className="font-mono text-xs">Workbook:</code>) for a single question that gets its own page.
          </p>
          <CodeBlock>{`Multi-Prompt Page: What Makes You Unique
Prompt 1: What do you do that others in your space don't?
Prompt 2: What do your clients always come back and thank you for?
Prompt 3: What would your business lose if you stopped being yourself?`}</CodeBlock>
        </GuideSection>

        <GuideSection title="Full Example">
          <p className="text-sm mb-3" style={{ color: "#6b6470" }}>
            A complete kit using all major page types.
          </p>
          <CodeBlock>{`Kit Name: Brand Clarity Workbook
Subtitle: Define your brand from the inside out
Branch: Brand
Audience: Creative entrepreneurs
Tone: Clear and encouraging
Tagline: Build the brand only you can build.

---

Cover: Brand Clarity Workbook

---

Lesson: What Is Brand Clarity
Body: Brand clarity means you know exactly who you are, what you offer, and who you serve.
Body: When your brand is clear, your content, offers, and copy all become easier to write.

---

Workbook: Your Brand in One Sentence
Prompt: My brand helps ________ do ________ so they can ________.
Lines: 8

---

Multi-Prompt Page: What Makes You Unique
Prompt 1: What do you do that others in your space don't?
Prompt 2: What do your clients always come back and thank you for?
Prompt 3: What would your business lose if you stopped being yourself?

---

Checklist: Brand Clarity Actions
- Write your one-sentence brand statement
- Identify your top three brand values
- Define your ideal client in three sentences
- Review your website copy against your brand statement

---

Table: Brand Tracker
Headers: Element, Current State, Goal
Row: Brand statement, Draft only, Clear and published
Row: Visual identity, Inconsistent, Cohesive across platforms
Row: Client experience, Informal, Documented and repeatable

---

Back Cover:`}</CodeBlock>
        </GuideSection>

        <GuideSection title="Rough Labels That Are Cleaned Up Automatically">
          <p className="text-sm mb-3" style={{ color: "#6b6470" }}>
            The importer normalises common rough labels before parsing, so you do not need strict formatting for these. You will see a cleanup note when this runs.
          </p>
          <LabelTable
            rows={[
              ["Cover Title: → Kit Name:", "Title at the top of the doc is used as kit name"],
              ["Lesson Title: / Lesson Body: → Lesson: / Body:", "Lesson page shorthand"],
              ["Workbook Title: / Question: → Workbook: / Prompt:", "Workbook page shorthand"],
              ["Description: → Body:", "Alternate body label"],
              ["Tracker Title: / Column Headers: → Table: / Headers:", "Table page shorthand"],
              ["Table Row: / Checklist Title: → Row: / Checklist:", "More table and checklist shorthands"],
            ]}
          />
        </GuideSection>
      </div>
    </div>
  );
}

function GuideSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre
      className="rounded-md border p-4 text-xs leading-6 overflow-x-auto"
      style={{ borderColor: "#D8CEC2", background: "#FAF6F0", color: "#222026" }}
    >
      {children}
    </pre>
  );
}

function LabelTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ background: "#FBF7F1" }}>
            <th
              className="text-left px-3 py-2 text-[10px] uppercase tracking-[0.18em] font-medium border"
              style={{ borderColor: "#D8CEC2", color: "#4F2D68", width: "40%" }}
            >
              Label
            </th>
            <th
              className="text-left px-3 py-2 text-[10px] uppercase tracking-[0.18em] font-medium border"
              style={{ borderColor: "#D8CEC2", color: "#4F2D68" }}
            >
              What it does
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, description]) => (
            <tr key={label}>
              <td
                className="px-3 py-2 border font-mono text-xs align-top"
                style={{ borderColor: "#D8CEC2", color: "#4F2D68" }}
              >
                {label}
              </td>
              <td
                className="px-3 py-2 border text-xs"
                style={{ borderColor: "#D8CEC2", color: "#4b4450" }}
              >
                {description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
