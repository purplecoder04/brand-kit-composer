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

export function LessonTemplate({ block, branchProfile, pageNumber, totalPages }: Props) {
  const paragraphs = (block.body || "").split(/\n\s*\n/).filter(Boolean);
  const gold = branchProfile.goldAccent;

  return (
    <PageCanvas
      branchProfile={branchProfile}
      pageNumber={pageNumber}
      totalPages={totalPages}
      bleed
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "#F5EFE3" }} />
      <CornerWash branchProfile={branchProfile} variant="topRight" />
      <CornerWash branchProfile={branchProfile} variant="bottomLeft" />

      <BotanicalSprig
        color={gold}
        width="0.5in"
        height="1.4in"
        style={{ position: "absolute", left: "0.35in", top: "3.6in" }}
      />

      <div
        style={{
          position: "absolute",
          top: "0.6in",
          left: "0.95in",
          right: "0.6in",
          bottom: "1.05in",
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
              marginBottom: "0.18in",
            }}
          >
            {block.subtitle}
          </div>
        ) : null}

        <h1
          style={{
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            fontSize: "44px",
            lineHeight: 1.05,
            fontWeight: 500,
            color: PLUM_DEEP,
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {block.title}
        </h1>

        <SparkleRule color={gold} width="2in" marginTop="0.28in" marginBottom="0.4in" align="left" />

        <div
          style={{
            position: "relative",
            maxWidth: "5.9in",
            paddingLeft: "0.3in",
            borderLeft: `2px solid ${gold}`,
          }}
        >
          {paragraphs.map((p, i) => (
            <p
              key={i}
              style={{
                fontSize: "13px",
                lineHeight: 1.8,
                color: PLUM_DEEP,
                margin: "0 0 0.22in",
              }}
            >
              {p}
            </p>
          ))}
        </div>

        <div style={{ marginTop: "0.4in", display: "flex", alignItems: "center", gap: "0.12in" }}>
          <Diamond color={gold} inline />
          <div style={{ flex: 1, height: "1px", background: gold, opacity: 0.5, maxWidth: "1.2in" }} />
        </div>
      </div>
    </PageCanvas>
  );
}