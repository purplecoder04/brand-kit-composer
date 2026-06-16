import type { BranchProfile } from "@/lib/branch-profile";
import type { Block } from "@/lib/kit-types";
import {
  bodyOffsetStyle,
  bodyTextStyle,
  titleOffsetStyle,
  titleTextStyle,
} from "@/lib/layout-polish";
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

export function BackCoverTemplate({ block, branchProfile, pageNumber, totalPages }: Props) {
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
      <InteriorEditorialFrame branchProfile={branchProfile} density="feature" />
      <CornerWash branchProfile={branchProfile} variant="both" />

      <BotanicalSprig
        color={smallMark}
        width="0.68in"
        height="1.72in"
        style={{
          position: "absolute",
          left: "0.5in",
          top: "7.25in",
          opacity: 0.78,
        }}
      />

      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "0.7in",
          right: "0.7in",
          top: "0.76in",
          height: "1px",
          background: lineAccent,
          opacity: 0.72,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: "1.35in 0.82in 1.22in",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "9.5px",
            letterSpacing: "0.42em",
            textTransform: "uppercase",
            color: branchProfile.primaryColor,
            fontWeight: 600,
          }}
        >
          Best Collective
        </div>

        <h1
          style={{
            margin: "0.2in 0 0",
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            fontSize: "46px",
            lineHeight: 1.05,
            fontWeight: 500,
            color: branchProfile.primaryColor,
            letterSpacing: "0",
          }}
        >
          {branchProfile.branchLabel}
        </h1>

        {block.title ? (
          <div
            style={{
              marginTop: "0.2in",
              fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
              lineHeight: 1.18,
              color: branchProfile.primaryColor,
              ...titleTextStyle(block, 25, "center"),
              ...titleOffsetStyle(block),
            }}
          >
            {block.title}
          </div>
        ) : null}

        <SparkleRule color={lineAccent} width="2.25in" marginTop="0.28in" marginBottom="0.3in" />

        {block.body ? (
          <p
            style={{
              maxWidth: "5.65in",
              margin: 0,
              fontFamily: "var(--font-body, Inter, sans-serif)",
              lineHeight: 1.75,
              color: branchProfile.textColor,
              ...bodyTextStyle(block, 14, "center"),
              ...bodyOffsetStyle(block),
            }}
          >
            {block.body}
          </p>
        ) : null}

        {block.prompt ? (
          <div
            style={{
              marginTop: "0.34in",
              minWidth: "3.4in",
              maxWidth: "5.4in",
              padding: "0.16in 0.28in",
              borderTop: `1px solid ${lineAccent}`,
              borderBottom: `1px solid ${lineAccent}`,
              background: PAPER_PANEL,
              color: branchProfile.primaryColor,
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
            }}
          >
            {block.prompt}
          </div>
        ) : null}

        {block.subtitle ? (
          <div
            style={{
              marginTop: "0.42in",
              display: "flex",
              alignItems: "center",
              gap: "0.1in",
              fontSize: "8.5px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: branchProfile.primaryColor,
              fontWeight: 600,
            }}
          >
            <Diamond color={smallMark} inline size={10} />
            <span>{block.subtitle}</span>
          </div>
        ) : null}
      </div>

      <KitFooterBand
        branchProfile={branchProfile}
        pageNumber={pageNumber}
        totalPages={totalPages}
      />
    </PageCanvas>
  );
}
