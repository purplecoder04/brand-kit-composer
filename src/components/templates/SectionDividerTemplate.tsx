import type { BranchProfile } from "@/lib/branch-profile";
import type { Block } from "@/lib/kit-types";
import { PageCanvas } from "../PageCanvas";
import {
  BotanicalSprig,
  CornerWash,
  Diamond,
  InteriorEditorialFrame,
  KitFooterBand,
  SparkleRule,
} from "./_decor";

type Props = {
  block: Block;
  branchProfile: BranchProfile;
  pageNumber?: number;
  totalPages?: number;
};

export function SectionDividerTemplate({ block, branchProfile, pageNumber, totalPages }: Props) {
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

      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "0.65in",
          right: "0.65in",
          top: "0.62in",
          height: "1px",
          background: lineAccent,
          opacity: 0.7,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "0.74in",
          left: "0.78in",
          right: "0.78in",
          bottom: "0.98in",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0.4in 0.72in",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            letterSpacing: "0.42em",
            textTransform: "uppercase",
            color: branchProfile.primaryColor,
            fontWeight: 600,
            marginBottom: "0.24in",
          }}
        >
          {block.title}
        </div>

        <SparkleRule color={lineAccent} width="2.2in" marginBottom="0.4in" />

        <h2
          style={{
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            fontSize: "64px",
            lineHeight: 1.05,
            fontWeight: 500,
            color: branchProfile.primaryColor,
            margin: 0,
            letterSpacing: "0",
            maxWidth: "6in",
          }}
        >
          {block.subtitle}
        </h2>

        <Diamond color={smallMark} style={{ marginTop: "0.4in" }} />
        <BotanicalSprig
          color={smallMark}
          width="0.55in"
          height="1.05in"
          style={{ marginTop: "0.18in" }}
        />

        {block.body ? (
          <p
            style={{
              marginTop: "0.3in",
              fontSize: "14px",
              lineHeight: 1.7,
              color: branchProfile.textColor,
              maxWidth: "4.2in",
              fontStyle: "italic",
              opacity: 0.85,
              fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            }}
          >
            {block.body}
          </p>
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
