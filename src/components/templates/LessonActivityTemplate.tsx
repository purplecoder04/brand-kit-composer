import type { BranchProfile } from "@/lib/branch-profile";
import type { Block } from "@/lib/kit-types";
import {
  bodyOffsetStyle,
  bodyTextStyle,
  spacingValues,
  sparkleAlign,
  titleOffsetStyle,
  titleTextStyle,
} from "@/lib/layout-polish";
import { BasePage } from "./BasePage";
import {
  BotanicalSprig,
  CornerWash,
  Diamond,
  InteriorEditorialFrame,
  KitFooterBand,
  PAPER_PANEL,
  RichText,
  SparkleRule,
} from "./_decor";

type Props = {
  block: Block;
  branchProfile: BranchProfile;
  pageNumber?: number;
  totalPages?: number;
};

export function LessonActivityTemplate({ block, branchProfile, pageNumber, totalPages }: Props) {
  const paragraphs = splitParagraphs(block.body);
  const lineAccent = branchProfile.lineAccentColor;
  const smallMark = branchProfile.smallMarkColor;
  const spacing = spacingValues(block);
  const activityType = block.activityType ?? "checklist";
  const activityLabel =
    activityType === "action-steps"
      ? "Action Steps"
      : activityType === "writing-prompt"
        ? "Practice Prompt"
        : "Remember This";

  return (
    <BasePage
      branchProfile={branchProfile}
      pageNumber={pageNumber}
      totalPages={totalPages}
      showFooter={false}
      bleed
    >
      <InteriorEditorialFrame branchProfile={branchProfile} />
      <CornerWash branchProfile={branchProfile} variant="topRight" />
      <CornerWash branchProfile={branchProfile} variant="bottomLeft" />

      <BotanicalSprig
        color={smallMark}
        width="0.45in"
        height="1.2in"
        style={{ position: "absolute", right: "0.42in", top: "4.1in", opacity: 0.58 }}
      />

      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "0.62in",
          top: "0.62in",
          width: "2.1in",
          height: "1px",
          background: lineAccent,
          opacity: 0.72,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "0.72in",
          left: "0.72in",
          right: "0.72in",
          bottom: "1in",
          paddingBottom: "60px",
        }}
      >
        {block.subtitle ? (
          <div
            style={{
              fontSize: "10px",
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              color: branchProfile.primaryColor,
              fontWeight: 600,
              marginBottom: "0.12in",
            }}
          >
            <RichText text={block.subtitle} />
          </div>
        ) : null}

        <h1
          style={{
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            lineHeight: 1.05,
            fontWeight: 500,
            color: branchProfile.primaryColor,
            margin: 0,
            letterSpacing: "0",
            ...titleTextStyle(block, 38),
            ...titleOffsetStyle(block),
          }}
        >
          <RichText text={block.title} />
        </h1>

        <SparkleRule
          color={lineAccent}
          width="2in"
          marginTop="0.2in"
          marginBottom="0.22in"
          align={sparkleAlign(block)}
        />

        <div
          style={{
            maxWidth: "7in",
            padding: "0.12in 0.24in 0.14in 0.2in",
            borderLeft: `2px solid ${lineAccent}`,
            background: `linear-gradient(90deg, ${PAPER_PANEL} 0%, rgba(255,253,248,0.18) 100%)`,
            ...bodyOffsetStyle(block),
          }}
        >
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              style={{
                lineHeight: spacing.lineHeight,
                color: branchProfile.textColor,
                margin: spacing.paragraphMargin,
                ...bodyTextStyle(block, 13.2),
              }}
            >
              <RichText text={paragraph} />
            </p>
          ))}
        </div>

        <ActivityPanel
          block={block}
          branchProfile={branchProfile}
          label={block.activityTitle || activityLabel}
          smallMark={smallMark}
          lineAccent={lineAccent}
        />

        {block.bottomNote ? (
          <BottomNote
            text={block.bottomNote}
            branchProfile={branchProfile}
            smallMark={smallMark}
            lineAccent={lineAccent}
          />
        ) : null}
      </div>

      <KitFooterBand
        branchProfile={branchProfile}
        pageNumber={pageNumber}
        totalPages={totalPages}
      />
    </BasePage>
  );
}

function ActivityPanel({
  block,
  branchProfile,
  label,
  smallMark,
  lineAccent,
}: {
  block: Block;
  branchProfile: BranchProfile;
  label: string;
  smallMark: string;
  lineAccent: string;
}) {
  const activityType = block.activityType ?? "checklist";
  const items = splitLines(block.activityItems);
  const prompt = block.prompt || block.activityItems;
  const lines = Math.max(4, Math.min(block.lines ?? 4, 8));

  if (activityType === "writing-prompt") {
    return (
      <section
        style={{
          marginTop: "0.2in",
          maxWidth: "6.45in",
          padding: "0.15in 0.18in 0.16in",
          display: "flex",
          flex: 1,
          flexDirection: "column",
          background: PAPER_PANEL,
          boxShadow: "0 10px 22px rgba(40, 36, 44, 0.045)",
          borderLeft: `2px solid ${lineAccent}`,
        }}
      >
        <PanelLabel label={label} smallMark={smallMark} branchProfile={branchProfile} />
        {prompt ? (
          <p
            style={{
              margin: "0 0 0.12in",
              color: branchProfile.textColor,
              fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
              fontStyle: "italic",
              lineHeight: 1.34,
              fontSize: "14px",
            }}
          >
            <RichText text={prompt} />
          </p>
        ) : null}
        <WritingLines count={lines} branchProfile={branchProfile} />
      </section>
    );
  }

  return (
    <section
      style={{
        marginTop: "0.2in",
        maxWidth: "6.45in",
        padding: "0.14in 0.18in",
        background: PAPER_PANEL,
        boxShadow: "0 10px 22px rgba(40, 36, 44, 0.045)",
        borderLeft: `2px solid ${lineAccent}`,
      }}
    >
      <PanelLabel label={label} smallMark={smallMark} branchProfile={branchProfile} />
      <div style={{ display: "grid", gap: "0.075in" }}>
        {items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            style={{
              display: "grid",
              gridTemplateColumns: activityType === "checklist" ? "0.18in 1fr" : "0.22in 1fr",
              gap: "0.12in",
              alignItems: "start",
              color: branchProfile.textColor,
              fontSize: "12.8px",
              lineHeight: 1.32,
            }}
          >
            {activityType === "checklist" ? (
              <span
                aria-hidden
                style={{
                  width: "0.14in",
                  height: "0.14in",
                  border: `1.4px solid ${smallMark}`,
                  marginTop: "0.02in",
                }}
              />
            ) : (
              <span
                style={{
                  color: branchProfile.primaryColor,
                  fontWeight: 700,
                  fontSize: "11px",
                }}
              >
                {index + 1}.
              </span>
            )}
            <span>
              <RichText text={item} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PanelLabel({
  label,
  smallMark,
  branchProfile,
}: {
  label: string;
  smallMark: string;
  branchProfile: BranchProfile;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.08in",
        fontSize: "8.5px",
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        color: branchProfile.primaryColor,
        fontWeight: 600,
        marginBottom: "0.08in",
      }}
    >
      <Diamond color={smallMark} inline />
      <span>{label}</span>
    </div>
  );
}

function BottomNote({
  text,
  branchProfile,
  smallMark,
  lineAccent,
}: {
  text: string;
  branchProfile: BranchProfile;
  smallMark: string;
  lineAccent: string;
}) {
  return (
    <aside
      style={{
        marginTop: "0.18in",
        maxWidth: "6.35in",
        display: "flex",
        alignItems: "start",
        gap: "0.1in",
        marginBottom: "48px",
        breakInside: "avoid",
        pageBreakInside: "avoid",
        color: branchProfile.textColor,
        fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
        fontSize: "14px",
        fontStyle: "italic",
        lineHeight: 1.36,
        paddingTop: "0.1in",
        borderTop: `1px solid ${lineAccent}`,
      }}
    >
      <Diamond color={smallMark} inline />
      <span>
        <RichText text={text} />
      </span>
    </aside>
  );
}

function WritingLines({ count, branchProfile }: { count: number; branchProfile: BranchProfile }) {
  return (
    <div
      style={{
        borderTop: `1px solid ${branchProfile.worksheetLineColor}`,
        width: "100%",
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          style={{
            flex: 1,
            height: "auto",
            minHeight: "0.3in",
            borderBottom: `1px solid ${branchProfile.worksheetLineColor}`,
          }}
        />
      ))}
    </div>
  );
}

function splitParagraphs(value?: string): string[] {
  return (value ?? "")
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLines(value?: string): string[] {
  return (value ?? "")
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean)
    .slice(0, 7);
}
