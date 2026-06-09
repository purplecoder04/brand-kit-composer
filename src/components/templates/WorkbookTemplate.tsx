import type { BranchProfile } from "@/lib/branch-profile";
import type { Block } from "@/lib/kit-types";
import { PageCanvas } from "../PageCanvas";

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
          fontSize: "32px",
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
          margin: "0.22in 0 0.3in",
        }}
      />

      {block.prompt ? (
        <p
          style={{
            fontSize: "13px",
            lineHeight: 1.7,
            color: branchProfile.textColor,
            maxWidth: "6.5in",
            margin: "0 0 0.35in",
            fontStyle: "italic",
          }}
        >
          {block.prompt}
        </p>
      ) : null}

      <div
        style={{
          marginTop: "0.1in",
          borderTop: `1px solid ${branchProfile.stoneColor}`,
        }}
      >
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
    </PageCanvas>
  );
}