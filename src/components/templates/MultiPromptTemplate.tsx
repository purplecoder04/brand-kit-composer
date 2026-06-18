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

export function MultiPromptTemplate({ block, branchProfile, pageNumber, totalPages }: Props) {
  const items = parseMultiPrompts(block.body || block.prompt);
  const lineAccent = branchProfile.lineAccentColor;
  const smallMark = branchProfile.smallMarkColor;

  return (
    <PageCanvas
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
            {block.subtitle}
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
          {block.title}
        </h1>

        <SparkleRule
          color={lineAccent}
          width="2in"
          marginTop="0.24in"
          marginBottom="0.3in"
          align={sparkleAlign(block)}
        />

        <div style={{ display: "grid", gap: "0.18in", ...bodyOffsetStyle(block) }}>
          {items.map((item, index) => (
            <section
              key={`${item.prompt}-${index}`}
              style={{
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
                {item.prompt}
              </p>
              <WritingLines count={item.lines} branchProfile={branchProfile} />
            </section>
          ))}
        </div>
      </div>

      <KitFooterBand
        branchProfile={branchProfile}
        pageNumber={pageNumber}
        totalPages={totalPages}
      />
    </PageCanvas>
  );
}

function WritingLines({ count, branchProfile }: { count: number; branchProfile: BranchProfile }) {
  return (
    <div
      style={{
        borderTop: `1px solid ${branchProfile.worksheetLineColor}`,
        width: "100%",
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          style={{
            height: "0.28in",
            borderBottom: `1px solid ${branchProfile.worksheetLineColor}`,
          }}
        />
      ))}
    </div>
  );
}
