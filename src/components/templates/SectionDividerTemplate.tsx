import type { BranchProfile } from "@/lib/branch-profile";
import type { Block } from "@/lib/kit-types";
import { PageCanvas } from "../PageCanvas";

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
  return (
    <PageCanvas
      branchProfile={branchProfile}
      pageNumber={pageNumber}
      totalPages={totalPages}
    >
      <div aria-hidden style={{ position: "absolute", top: "-1in", left: "-1in", width: "2.6in", height: "2.6in", borderRadius: "50%", background: branchProfile.lilacColor, opacity: 0.45 }} />
      <div aria-hidden style={{ position: "absolute", bottom: "-1in", right: "-1in", width: "2.6in", height: "2.6in", borderRadius: "50%", background: branchProfile.blushColor, opacity: 0.45 }} />
      <div aria-hidden style={{ position: "absolute", top: "1.4in", right: "0.9in", width: "0.9in", height: "0.9in", borderRadius: "50%", background: branchProfile.stoneColor, opacity: 0.55 }} />
      <div
        style={{
          height: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: branchProfile.primaryColor,
            marginBottom: "0.3in",
          }}
        >
          {block.title}
        </div>

        <div
          style={{
            width: "1.4in",
            height: "2px",
            background: branchProfile.goldAccent,
            marginBottom: "0.35in",
          }}
        />

        <h2
          style={{
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            fontSize: "52px",
            lineHeight: 1.1,
            fontWeight: 500,
            color: branchProfile.primaryColor,
            margin: 0,
            maxWidth: "6in",
          }}
        >
          {block.subtitle || "Section"}
        </h2>

        <div style={{ width: "1.4in", height: "2px", background: branchProfile.goldAccent, marginTop: "0.35in" }} />

        {block.body ? (
          <p
            style={{
              marginTop: "0.4in",
              fontSize: "14px",
              lineHeight: 1.7,
              color: branchProfile.textColor,
              maxWidth: "4.5in",
              fontStyle: "italic",
              opacity: 0.85,
            }}
          >
            {block.body}
          </p>
        ) : null}
      </div>
    </PageCanvas>
  );
}