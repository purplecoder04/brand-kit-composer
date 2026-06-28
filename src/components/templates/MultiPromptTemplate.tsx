import type { BranchProfile } from "@/lib/branch-profile";
import type { Block } from "@/lib/kit-types";
import { parseMultiPrompts } from "@/lib/multi-prompt";
import {
  bodyOffsetStyle,
  bodyTextStyle,
  sparkleAlign,
  titleOffsetStyle,
  titleTextStyle,
} from "@/lib/layout-polish";
import { BasePage } from "./BasePage";
import {
  CornerWash,
  BottomEncouragementNote,
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

export function MultiPromptTemplate({ block, branchProfile, pageNumber, totalPages }: Props) {
  const items = parseMultiPrompts(block.body || block.prompt);
  const lineAccent = branchProfile.lineAccentColor;
  const smallMark = branchProfile.smallMarkColor;

  return (
    <BasePage
      branchProfile={branchProfile}
      pageNumber={pageNumber}
      totalPages={totalPages}
      showFooter={false}
      bleed
    >
      <InteriorEditorialFrame branchProfile={branchProfile} />
      <CornerWash branchProfile={branchProfile} variant="topLeft" />
      <CornerWash branchProfile={branchProfile} variant="bottomRight" />

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
          top: "0.86in",
          left: "0.72in",
          right: "0.82in",
          bottom: "1in",
          display: "flex",
          flexDirection: "column",
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
              marginBottom: "0.16in",
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
            ...titleTextStyle(block, 40),
            ...titleOffsetStyle(block),
          }}
        >
          <RichText text={block.title} />
        </h1>

        <SparkleRule
          color={lineAccent}
          width="2in"
          marginTop="0.24in"
          marginBottom="0.3in"
          align={sparkleAlign(block)}
        />

        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            gap: "0.18in",
            ...bodyOffsetStyle(block),
          }}
        >
          {items.map((item, index) => (
            <section
              key={`${item.prompt}-${index}`}
              style={{
                display: "flex",
                flex: 1,
                flexDirection: "column",
                padding: "0.16in 0.18in",
                borderLeft: `2px solid ${lineAccent}`,
                background: PAPER_PANEL,
                boxShadow: "0 10px 22px rgba(40, 36, 44, 0.045)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.08in",
                  fontSize: "8.5px",
                  letterSpacing: "0.34em",
                  textTransform: "uppercase",
                  color: branchProfile.primaryColor,
                  fontWeight: 600,
                  marginBottom: "0.06in",
                }}
              >
                <Diamond color={smallMark} inline />
                <span>Prompt {index + 1}</span>
              </div>
              <p
                style={{
                  margin: "0 0 0.12in",
                  fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
                  fontStyle: "italic",
                  lineHeight: 1.35,
                  color: branchProfile.textColor,
                  ...bodyTextStyle(block, 14),
                }}
              >
                <RichText text={item.prompt} />
              </p>
              <WritingLines count={item.lines} branchProfile={branchProfile} />
            </section>
          ))}
        </div>
        <BottomEncouragementNote
          text={block.bottomNote}
          branchProfile={branchProfile}
          style={{ marginTop: "0.18in", maxWidth: "6.2in" }}
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
            minHeight: "0.28in",
            borderBottom: `1px solid ${branchProfile.worksheetLineColor}`,
          }}
        />
      ))}
    </div>
  );
}
