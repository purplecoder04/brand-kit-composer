import type { BranchProfile } from "@/lib/branch-profile";
import type { Block } from "@/lib/kit-types";
import { PageCanvas } from "../PageCanvas";
import { BotanicalSprig, CornerWash, Diamond, PLUM_DEEP, SparkleRule } from "./_decor";

type Props = {
  block: Block;
  branchProfile: BranchProfile;
  pageNumber?: number;
  totalPages?: number;
};

export function SectionDividerTemplate({
  block,
  branchProfile,
  pageNumber,
  totalPages,
}: Props) {
  const gold = branchProfile.goldAccent;
  return (
    <PageCanvas
      branchProfile={branchProfile}
      pageNumber={pageNumber}
      totalPages={totalPages}
      bleed
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "#F5EFE3" }} />
      <CornerWash branchProfile={branchProfile} variant="both" />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "1.2in",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            letterSpacing: "0.42em",
            textTransform: "uppercase",
            color: PLUM_DEEP,
            fontWeight: 600,
            marginBottom: "0.28in",
          }}
        >
          {block.title}
        </div>

        <SparkleRule color={gold} width="2.2in" marginBottom="0.4in" />

        <h2
          style={{
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            fontSize: "64px",
            lineHeight: 1.05,
            fontWeight: 500,
            color: PLUM_DEEP,
            margin: 0,
            letterSpacing: "-0.01em",
            maxWidth: "6in",
          }}
        >
          {block.subtitle || "Section"}
        </h2>

        <Diamond color={gold} style={{ marginTop: "0.4in" }} />
        <BotanicalSprig color={gold} width="0.55in" height="1.05in" style={{ marginTop: "0.18in" }} />

        {block.body ? (
          <p
            style={{
              marginTop: "0.3in",
              fontSize: "14px",
              lineHeight: 1.7,
              color: PLUM_DEEP,
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
    </PageCanvas>
  );
}