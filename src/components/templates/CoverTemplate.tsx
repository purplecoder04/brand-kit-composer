import type { BranchProfile } from "@/lib/branch-profile";
import type { Block } from "@/lib/kit-types";
import { PageCanvas } from "../PageCanvas";

type Props = {
  block: Block;
  branchProfile: BranchProfile;
  pageNumber?: number;
  totalPages?: number;
};

export function CoverTemplate({ block, branchProfile, pageNumber, totalPages }: Props) {
  return (
    <PageCanvas
      branchProfile={branchProfile}
      pageNumber={pageNumber}
      totalPages={totalPages}
      showFooter={false}
    >
      {/* Organic corner shapes */}
      <div aria-hidden style={{ position: "absolute", top: "-1.6in", right: "-1.6in", width: "4.6in", height: "4.6in", borderRadius: "50%", background: branchProfile.lilacColor, opacity: 0.55 }} />
      <div aria-hidden style={{ position: "absolute", top: "-0.6in", right: "1.2in", width: "2in", height: "2in", borderRadius: "50%", background: branchProfile.blushColor, opacity: 0.55 }} />
      <div aria-hidden style={{ position: "absolute", bottom: "-1.4in", left: "-1.4in", width: "3.8in", height: "3.8in", borderRadius: "50%", background: branchProfile.stoneColor, opacity: 0.55 }} />
      <div aria-hidden style={{ position: "absolute", bottom: "1.4in", left: "1.6in", width: "1.4in", height: "1.4in", borderRadius: "50%", background: branchProfile.accentColor, opacity: 0.18 }} />

      {/* Brand header */}
      <div style={{ position: "absolute", top: "0.55in", left: "0.6in", right: "0.6in", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", letterSpacing: "0.32em", textTransform: "uppercase", color: branchProfile.primaryColor }}>
        <span>Best Collective</span>
        <span>{branchProfile.name}</span>
      </div>
      <div style={{ position: "absolute", top: "0.78in", left: "0.6in", right: "0.6in", height: "1px", background: branchProfile.goldAccent, opacity: 0.7 }} />

      {/* Centered cream panel */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.4in 0.9in" }}>
        <div style={{
          position: "relative",
          width: "100%",
          background: "#FFFDF8",
          border: `1px solid ${branchProfile.stoneColor}`,
          boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 18px 40px rgba(79,45,104,0.08)",
          padding: "0.85in 0.7in",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.36em", textTransform: "uppercase", color: branchProfile.primaryColor, marginBottom: "0.35in" }}>
            Brand Kit · Volume One
          </div>
          <h1 style={{
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            fontSize: "56px",
            lineHeight: 1.05,
            fontWeight: 500,
            color: branchProfile.primaryColor,
            margin: 0,
            letterSpacing: "-0.01em",
          }}>
            {block.title}
          </h1>
          <div style={{ width: "1.2in", height: "2px", background: branchProfile.goldAccent, margin: "0.35in auto" }} />
          {block.subtitle ? (
            <div style={{ fontSize: "16px", color: branchProfile.textColor, opacity: 0.85, fontStyle: "italic" }}>
              {block.subtitle}
            </div>
          ) : null}
          {block.body ? (
            <p style={{ marginTop: "0.35in", fontSize: "13px", lineHeight: 1.7, color: branchProfile.textColor, maxWidth: "4.6in", marginLeft: "auto", marginRight: "auto" }}>
              {block.body}
            </p>
          ) : null}
        </div>
      </div>

      {/* Brand footer */}
      <div style={{ position: "absolute", bottom: "0.78in", left: "0.6in", right: "0.6in", height: "1px", background: branchProfile.goldAccent, opacity: 0.7 }} />
      <div style={{ position: "absolute", bottom: "0.5in", left: "0.6in", right: "0.6in", display: "flex", justifyContent: "space-between", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: branchProfile.primaryColor }}>
        <span>{branchProfile.footerLabel}</span>
        <span>Est. 2026</span>
      </div>
    </PageCanvas>
  );
}