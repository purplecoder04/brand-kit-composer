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
  BottomEncouragementNote,
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

export function LessonTemplate({ block, branchProfile, pageNumber, totalPages }: Props) {
  const paragraphs = (block.body || "").split(/\n\s*\n/).filter(Boolean);
  const lineAccent = branchProfile.lineAccentColor;
  const smallMark = branchProfile.smallMarkColor;
  const spacing = spacingValues(block);

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
        width="0.5in"
        height="1.4in"
        style={{ position: "absolute", left: "0.28in", top: "3.55in", opacity: 0.66 }}
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
          right: "0.58in",
          bottom: "0.82in",
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
            ...titleTextStyle(block, 39),
            ...titleOffsetStyle(block),
          }}
        >
          <RichText text={block.title} />
        </h1>

        <SparkleRule
          color={lineAccent}
          width="2in"
          marginTop="0.22in"
          marginBottom="0.26in"
          align={sparkleAlign(block)}
        />

        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "7.02in",
            padding: "0.14in 0.3in 0.16in 0.24in",
            borderLeft: `2px solid ${lineAccent}`,
            background: `linear-gradient(90deg, ${PAPER_PANEL} 0%, rgba(255,253,248,0) 92%)`,
            ...bodyOffsetStyle(block),
          }}
        >
          {paragraphs.map((p, i) => (
            <p
              key={i}
              style={{
                lineHeight: spacing.lineHeight,
                color: branchProfile.textColor,
                margin: spacing.paragraphMargin,
                ...bodyTextStyle(block, 13.6),
              }}
            >
              <RichText text={p} />
            </p>
          ))}
        </div>

        <div style={{ marginTop: "0.4in", display: "flex", alignItems: "center", gap: "0.12in" }}>
          <Diamond color={smallMark} inline />
          <div
            style={{
              flex: 1,
              height: "1px",
              background: lineAccent,
              opacity: 0.5,
              maxWidth: "1.2in",
            }}
          />
        </div>
        <BottomEncouragementNote
          text={block.bottomNote}
          branchProfile={branchProfile}
          style={{ marginTop: "0.2in", maxWidth: "6.35in" }}
        />
      </div>
      <KitFooterBand
        branchProfile={branchProfile}
        pageNumber={pageNumber}
        totalPages={totalPages}
      />
    </BasePage>
  );
}
