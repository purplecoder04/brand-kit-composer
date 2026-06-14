import type { BranchProfile } from "@/lib/branch-profile";
import type { Block, PageType } from "@/lib/kit-types";
import { PageCanvas } from "../PageCanvas";
import {
  CornerWash,
  Diamond,
  InteriorEditorialFrame,
  KitFooterBand,
  PAPER_PANEL,
  SparkleRule,
} from "./_decor";

type Props = {
  block: Block;
  branchProfile: BranchProfile;
  pageNumber?: number;
  totalPages?: number;
};

const PAGE_LABELS: Partial<Record<PageType, string>> = {
  "start-here": "Start Here",
  "module-intro": "Module Intro",
  quote: "Opening Thought",
  reflection: "Reflection",
  "action-plan": "Action Plan",
  resource: "Resources",
  "case-study": "Case Study",
  "prompt-page": "Prompt",
  "progress-check": "Progress Check",
  closing: "Next Steps",
};

const WRITING_PAGE_TYPES: PageType[] = ["reflection", "prompt-page"];

export function StructuredPageTemplate({ block, branchProfile, pageNumber, totalPages }: Props) {
  const lineAccent = branchProfile.lineAccentColor;
  const smallMark = branchProfile.smallMarkColor;
  const label = PAGE_LABELS[block.pageType] ?? "Kit Page";
  const paragraphs = splitParagraphs(block.body);
  const lineCount = WRITING_PAGE_TYPES.includes(block.pageType)
    ? Math.max(0, Math.min(block.lines ?? 0, 20))
    : 0;
  const isModuleIntro = block.pageType === "module-intro";
  const isQuote = block.pageType === "quote";
  const isActionPlan = block.pageType === "action-plan";
  const isProgressCheck = block.pageType === "progress-check";
  const listItems = isActionPlan || isProgressCheck ? splitLines(block.body) : [];

  return (
    <PageCanvas
      branchProfile={branchProfile}
      pageNumber={pageNumber}
      totalPages={totalPages}
      showFooter={false}
      bleed
    >
      <InteriorEditorialFrame
        branchProfile={branchProfile}
        density={isModuleIntro || isQuote ? "feature" : "quiet"}
      />
      <CornerWash branchProfile={branchProfile} variant={isModuleIntro ? "both" : "topRight"} />
      <CornerWash branchProfile={branchProfile} variant="bottomLeft" />

      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "0.62in",
          top: "0.62in",
          width: isModuleIntro ? "6.8in" : "2.1in",
          height: "1px",
          background: lineAccent,
          opacity: 0.72,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: isModuleIntro ? "1.3in" : "0.86in",
          left: "0.72in",
          right: "0.82in",
          bottom: "1in",
          display: "flex",
          flexDirection: "column",
          justifyContent: isModuleIntro || isQuote ? "center" : "flex-start",
          textAlign: isModuleIntro || isQuote ? "center" : "left",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            letterSpacing: "0.42em",
            textTransform: "uppercase",
            color: branchProfile.primaryColor,
            fontWeight: 600,
            marginBottom: "0.16in",
          }}
        >
          {block.subtitle || label}
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            fontSize: isModuleIntro ? "58px" : isQuote ? "50px" : "40px",
            lineHeight: 1.06,
            fontWeight: 500,
            color: branchProfile.primaryColor,
            margin: 0,
            letterSpacing: "0",
            maxWidth: isModuleIntro || isQuote ? "6.35in" : "6.1in",
            alignSelf: isModuleIntro || isQuote ? "center" : "auto",
          }}
        >
          {block.title}
        </h1>

        <SparkleRule
          color={lineAccent}
          width={isModuleIntro || isQuote ? "2.35in" : "2in"}
          marginTop="0.24in"
          marginBottom={isModuleIntro || isQuote ? "0.32in" : "0.28in"}
          align={isModuleIntro || isQuote ? "center" : "left"}
        />

        {isQuote ? (
          <QuoteBody block={block} branchProfile={branchProfile} smallMark={smallMark} />
        ) : isActionPlan || isProgressCheck ? (
          <ActionList items={listItems} branchProfile={branchProfile} smallMark={smallMark} />
        ) : (
          <BodyCopy paragraphs={paragraphs} branchProfile={branchProfile} />
        )}

        {block.prompt ? (
          <PromptPanel
            label={WRITING_PAGE_TYPES.includes(block.pageType) ? "Prompt" : "Focus"}
            prompt={block.prompt}
            branchProfile={branchProfile}
            lineAccent={lineAccent}
            smallMark={smallMark}
          />
        ) : null}

        {lineCount > 0 ? <WritingLines count={lineCount} branchProfile={branchProfile} /> : null}
      </div>

      <KitFooterBand
        branchProfile={branchProfile}
        pageNumber={pageNumber}
        totalPages={totalPages}
      />
    </PageCanvas>
  );
}

function BodyCopy({
  paragraphs,
  branchProfile,
}: {
  paragraphs: string[];
  branchProfile: BranchProfile;
}) {
  if (paragraphs.length === 0) return null;

  return (
    <div
      style={{
        maxWidth: "5.95in",
        padding: "0.12in 0.28in 0.04in",
        background: "rgba(255,253,248,0.72)",
        borderLeft: `2px solid ${branchProfile.lineAccentColor}`,
        boxShadow: "0 10px 22px rgba(40, 36, 44, 0.045)",
        color: branchProfile.textColor,
        fontSize: "14px",
        lineHeight: 1.7,
      }}
    >
      {paragraphs.map((paragraph, index) => (
        <p key={index} style={{ margin: "0 0 0.18in" }}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function QuoteBody({
  block,
  branchProfile,
  smallMark,
}: {
  block: Block;
  branchProfile: BranchProfile;
  smallMark: string;
}) {
  return (
    <div style={{ alignSelf: "center", maxWidth: "5.6in" }}>
      {block.body ? (
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            fontSize: "24px",
            lineHeight: 1.38,
            color: branchProfile.textColor,
            fontStyle: "italic",
          }}
        >
          {block.body}
        </p>
      ) : null}
      {block.prompt ? (
        <div
          style={{
            marginTop: "0.26in",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.1in",
            color: branchProfile.primaryColor,
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          <Diamond color={smallMark} inline size={10} />
          <span>{block.prompt}</span>
        </div>
      ) : null}
    </div>
  );
}

function ActionList({
  items,
  branchProfile,
  smallMark,
}: {
  items: string[];
  branchProfile: BranchProfile;
  smallMark: string;
}) {
  if (items.length === 0) return null;

  return (
    <div
      style={{
        maxWidth: "6.1in",
        background: PAPER_PANEL,
        borderLeft: `2px solid ${branchProfile.lineAccentColor}`,
        boxShadow: "0 10px 22px rgba(40, 36, 44, 0.05)",
        padding: "0.14in 0.3in",
      }}
    >
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          style={{
            display: "grid",
            gridTemplateColumns: "0.22in 1fr",
            gap: "0.13in",
            padding: "0.08in 0",
            borderBottom:
              index < items.length - 1 ? `1px solid ${branchProfile.worksheetLineColor}` : "none",
            color: branchProfile.textColor,
            fontSize: "14px",
            lineHeight: 1.5,
          }}
        >
          <Diamond color={smallMark} inline size={9} style={{ marginTop: "0.05in" }} />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function PromptPanel({
  label,
  prompt,
  branchProfile,
  lineAccent,
  smallMark,
}: {
  label: string;
  prompt: string;
  branchProfile: BranchProfile;
  lineAccent: string;
  smallMark: string;
}) {
  return (
    <div
      style={{
        maxWidth: "5.95in",
        marginTop: "0.24in",
        padding: "0.16in 0.28in",
        borderLeft: `2px solid ${lineAccent}`,
        background: PAPER_PANEL,
        boxShadow: "0 10px 22px rgba(40, 36, 44, 0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.08in",
          color: branchProfile.primaryColor,
          fontSize: "9.5px",
          fontWeight: 600,
          letterSpacing: "0.34em",
          textTransform: "uppercase",
          marginBottom: "0.07in",
        }}
      >
        <Diamond color={smallMark} inline />
        <span>{label}</span>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
          fontSize: "15px",
          lineHeight: 1.55,
          color: branchProfile.textColor,
          fontStyle: "italic",
        }}
      >
        {prompt}
      </p>
    </div>
  );
}

function WritingLines({ count, branchProfile }: { count: number; branchProfile: BranchProfile }) {
  return (
    <div
      style={{
        marginTop: "0.28in",
        borderTop: `1px solid ${branchProfile.worksheetLineColor}`,
        maxWidth: "6.1in",
        width: "100%",
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          style={{
            height: "0.36in",
            borderBottom: `1px solid ${branchProfile.worksheetLineColor}`,
          }}
        />
      ))}
    </div>
  );
}

function splitParagraphs(body?: string): string[] {
  return (body ?? "")
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLines(body?: string): string[] {
  return (body ?? "")
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
}
