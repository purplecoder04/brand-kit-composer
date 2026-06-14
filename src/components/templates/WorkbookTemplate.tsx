import type { BranchProfile } from "@/lib/branch-profile";
import type { Block } from "@/lib/kit-types";
import { PageCanvas } from "../PageCanvas";
import {
  BotanicalSprig,
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

export function WorkbookTemplate({ block, branchProfile, pageNumber, totalPages }: Props) {
  const lineCount = Math.max(0, Math.min(block.lines ?? 0, 20));
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

      <BotanicalSprig
        color={smallMark}
        width="0.5in"
        height="1.4in"
        style={{
          position: "absolute",
          right: "0.36in",
          top: "3.62in",
          transform: "scaleX(-1)",
          opacity: 0.84,
        }}
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
          top: "0.86in",
          left: "0.72in",
          right: "0.96in",
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
            fontSize: "40px",
            lineHeight: 1.05,
            fontWeight: 500,
            color: branchProfile.primaryColor,
            margin: 0,
            letterSpacing: "0",
          }}
        >
          {block.title}
        </h1>

        <SparkleRule
          color={lineAccent}
          width="2in"
          marginTop="0.24in"
          marginBottom="0.32in"
          align="left"
        />

        {block.prompt ? (
          <div
            style={{
              maxWidth: "5.9in",
              padding: "0.18in 0.3in",
              borderLeft: `2px solid ${lineAccent}`,
              background: `linear-gradient(90deg, ${PAPER_PANEL} 0%, rgba(255,253,248,0.28) 100%)`,
              marginBottom: "0.26in",
              boxShadow: "0 10px 22px rgba(40, 36, 44, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.08in",
                fontSize: "9.5px",
                letterSpacing: "0.38em",
                textTransform: "uppercase",
                color: branchProfile.primaryColor,
                fontWeight: 600,
                marginBottom: "0.08in",
              }}
            >
              <Diamond color={smallMark} inline />
              <span>Prompt</span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
                fontSize: "15px",
                lineHeight: 1.55,
                color: branchProfile.textColor,
                margin: 0,
                fontStyle: "italic",
              }}
            >
              {block.prompt}
            </p>
          </div>
        ) : null}

        <div
          style={{ borderTop: `1px solid ${branchProfile.worksheetLineColor}`, maxWidth: "6.1in" }}
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div
              key={i}
              style={{
                height: "0.4in",
                borderBottom: `1px solid ${branchProfile.worksheetLineColor}`,
              }}
            />
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
