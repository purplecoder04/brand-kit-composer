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

export function WorkbookTemplate({
  block,
  branchProfile,
  pageNumber,
  totalPages,
}: Props) {
  const lineCount = Math.max(4, Math.min(block.lines ?? 12, 20));
  const gold = branchProfile.goldAccent;

  return (
    <PageCanvas
      branchProfile={branchProfile}
      pageNumber={pageNumber}
      totalPages={totalPages}
      bleed
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "#F5EFE3" }} />
      <CornerWash branchProfile={branchProfile} variant="topLeft" />
      <CornerWash branchProfile={branchProfile} variant="bottomRight" />

      <BotanicalSprig
        color={gold}
        width="0.5in"
        height="1.4in"
        style={{ position: "absolute", right: "0.35in", top: "3.6in", transform: "scaleX(-1)" }}
      />

      <div
        style={{
          position: "absolute",
          top: "0.6in",
          left: "0.6in",
          right: "0.95in",
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
            fontSize: "40px",
            lineHeight: 1.05,
            fontWeight: 500,
            color: PLUM_DEEP,
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {block.title}
        </h1>

        <SparkleRule color={gold} width="2in" marginTop="0.24in" marginBottom="0.32in" align="left" />

        {block.prompt ? (
          <div
            style={{
              maxWidth: "5.9in",
              padding: "0.2in 0.3in",
              borderLeft: `2px solid ${gold}`,
              background: "rgba(255,253,248,0.55)",
              marginBottom: "0.3in",
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
                color: PLUM_DEEP,
                fontWeight: 600,
                marginBottom: "0.08in",
              }}
            >
              <Diamond color={gold} inline />
              <span>Prompt</span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
                fontSize: "15px",
                lineHeight: 1.55,
                color: PLUM_DEEP,
                margin: 0,
                fontStyle: "italic",
              }}
            >
              {block.prompt}
            </p>
          </div>
        ) : null}

        <div style={{ borderTop: `1px solid ${branchProfile.stoneColor}` }}>
          {Array.from({ length: lineCount }).map((_, i) => (
            <div
              key={i}
              style={{
                height: "0.42in",
                borderBottom: `1px solid ${branchProfile.stoneColor}`,
              }}
            />
          ))}
        </div>
      </div>
    </PageCanvas>
  );
}