import type { BranchProfile } from "@/lib/branch-profile";
import type { Block } from "@/lib/kit-types";
import { PageCanvas } from "../PageCanvas";
import {
  CornerWash,
  Diamond,
  KitFooterBand,
  PAPER_PANEL,
  PLUM_DEEP,
  SparkleRule,
  TEXT_INK,
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
  const gold = branchProfile.goldAccent;

  return (
    <PageCanvas
      branchProfile={branchProfile}
      pageNumber={pageNumber}
      totalPages={totalPages}
      showFooter={false}
      bleed
    >
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
          background: gold,
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
              color: PLUM_DEEP,
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
            fontSize: "40px",
            lineHeight: 1.05,
            fontWeight: 500,
            color: PLUM_DEEP,
            margin: 0,
            letterSpacing: "0",
          }}
        >
          {block.title}
        </h1>

        <SparkleRule
          color={gold}
          width="2in"
          marginTop="0.24in"
          marginBottom="0.34in"
          align="left"
        />

        <div
          style={{
            width: "100%",
            maxWidth: "6.3in",
            boxSizing: "border-box",
            background: PAPER_PANEL,
            borderLeft: `2px solid ${gold}`,
            padding: "0.18in 0.3in 0.08in",
            boxShadow: "0 10px 22px rgba(47, 23, 70, 0.05)",
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
                padding: "0.06in 0",
                borderBottom:
                  index < items.length - 1 ? `1px solid ${branchProfile.stoneColor}` : "none",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: "0.16in",
                  height: "0.16in",
                  border: `1.5px solid ${PLUM_DEEP}`,
                  background: PAPER_PANEL,
                  marginTop: "0.03in",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  fontSize: "14px",
                  lineHeight: 1.55,
                  color: TEXT_INK,
                  wordBreak: "break-word",
                }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "0.35in", display: "flex", alignItems: "center", gap: "0.12in" }}>
          <Diamond color={gold} inline />
          <div
            style={{ flex: 1, height: "1px", background: gold, opacity: 0.5, maxWidth: "1.2in" }}
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
