import type { BranchProfile } from "@/lib/branch-profile";
import type { Block } from "@/lib/kit-types";
import { PageCanvas } from "../PageCanvas";

type Props = {
  block: Block;
  branchProfile: BranchProfile;
  pageNumber?: number;
  totalPages?: number;
};

export function LessonTemplate({ block, branchProfile, pageNumber, totalPages }: Props) {
  const paragraphs = (block.body || "").split(/\n\s*\n/).filter(Boolean);

  return (
    <PageCanvas
      branchProfile={branchProfile}
      pageNumber={pageNumber}
      totalPages={totalPages}
    >
      {block.subtitle ? (
        <div
          style={{
            fontSize: "11px",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: branchProfile.primaryColor,
            marginBottom: "0.18in",
          }}
        >
          {block.subtitle}
        </div>
      ) : null}

      <h1
        style={{
          fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
          fontSize: "36px",
          lineHeight: 1.15,
          fontWeight: 500,
          color: branchProfile.primaryColor,
          margin: 0,
        }}
      >
        {block.title}
      </h1>

      <div
        style={{
          width: "0.8in",
          height: "2px",
          background: branchProfile.goldAccent,
          margin: "0.25in 0 0.35in",
        }}
      />

      <div style={{ maxWidth: "6.5in" }}>
        {paragraphs.map((p, i) => (
          <p
            key={i}
            style={{
              fontSize: "13px",
              lineHeight: 1.75,
              color: branchProfile.textColor,
              margin: "0 0 0.22in",
            }}
          >
            {p}
          </p>
        ))}
      </div>
    </PageCanvas>
  );
}