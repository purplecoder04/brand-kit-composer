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

export function ChecklistTemplate({ block, branchProfile, pageNumber, totalPages }: Props) {
  const items = (block.body ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const lineAccent = branchProfile.lineAccentColor;
  const smallMark = branchProfile.smallMarkColor;
  const spacing = spacingValues(block);

  return (
    <PageCanvas
      branchProfile={branchProfile}
      pageNumber={pageNumber}
      totalPages={totalPages}
      showFooter={false}
      bleed
    >
      <InteriorEditorialFrame branchProfile={branchProfile} />
      <CornerWash branchProfile={branchProfile} variant="topRight" />
      <CornerWash branchProfile={branchProfile} variant="bottomLeft" />

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
          right: "0.72in",
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
          marginBottom="0.34in"
          align={sparkleAlign(block)}
        />

        <div
          style={{
            width: "100%",
            maxWidth: "6.3in",
            boxSizing: "border-box",
            background: PAPER_PANEL,
            borderLeft: `2px solid ${lineAccent}`,
            padding: spacing.panelPadding,
            boxShadow: "0 10px 22px rgba(40, 36, 44, 0.05)",
            ...bodyOffsetStyle(block),
          }}
        >
          {items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns: "0.2in 1fr",
                columnGap: "0.16in",
                alignItems: "start",
                minHeight: "0.42in",
                padding: spacing.itemPadding,
                borderBottom:
                  index < items.length - 1
                    ? `1px solid ${branchProfile.worksheetLineColor}`
                    : "none",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: "0.16in",
                  height: "0.16in",
                  border: `1.5px solid ${branchProfile.smallMarkColor}`,
                  background: PAPER_PANEL,
                  marginTop: "0.03in",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  lineHeight: spacing.lineHeight,
                  color: branchProfile.textColor,
                  wordBreak: "break-word",
                  ...bodyTextStyle(block, 14),
                }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "0.35in", display: "flex", alignItems: "center", gap: "0.12in" }}>
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
      </div>

      <KitFooterBand
        branchProfile={branchProfile}
        pageNumber={pageNumber}
        totalPages={totalPages}
      />
    </PageCanvas>
  );
}
