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
  const plum = branchProfile.primaryColor;
  const gold = branchProfile.goldAccent;

  return (
    <PageCanvas
      branchProfile={branchProfile}
      pageNumber={pageNumber}
      totalPages={totalPages}
      showFooter={false}
      bleed
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, background: branchProfile.backgroundColor }} />

      {/* Reference-style soft organic accents */}
      <div aria-hidden style={{ position: "absolute", top: "0.26in", right: "-0.62in", width: "3.45in", height: "1.74in", borderRadius: "0 0 0 1.1in", background: branchProfile.lilacColor, opacity: 0.62 }} />
      <div aria-hidden style={{ position: "absolute", top: "0.26in", right: "1.24in", width: "1.36in", height: "1.08in", borderRadius: "0 0 999px 999px", background: branchProfile.blushColor, opacity: 0.52 }} />
      <div aria-hidden style={{ position: "absolute", left: "0.34in", bottom: "1.02in", width: "2.55in", height: "1.4in", borderRadius: "52% 48% 0 0 / 12% 14% 0 0", background: branchProfile.stoneColor, opacity: 0.56 }} />
      <div aria-hidden style={{ position: "absolute", left: "2.38in", bottom: "1.48in", width: "1.42in", height: "1.42in", borderRadius: "50%", background: branchProfile.accentColor, opacity: 0.16 }} />

      {/* Brand header */}
      <div style={{ position: "absolute", top: "0.56in", left: "0.68in", right: "0.68in", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "8.5px", letterSpacing: "0.36em", textTransform: "uppercase", color: plum, fontWeight: 600 }}>
        <span>Best Collective</span>
        <span>{branchProfile.name}</span>
      </div>
      <div style={{ position: "absolute", top: "0.78in", left: "0.68in", right: "0.68in", height: "1px", background: gold, opacity: 0.65 }} />

      {/* Centered cream panel */}
      <div style={{ position: "absolute", top: "1.56in", left: "0", right: "0", display: "flex", justifyContent: "center" }}>
        <div style={{
          position: "relative",
          width: "6.04in",
          minHeight: "3.03in",
          background: "#FFFDF8",
          border: `1px solid ${branchProfile.stoneColor}`,
          boxShadow: "0 1px 0 rgba(0,0,0,0.03), 0 20px 38px rgba(79,45,104,0.06)",
          padding: "0.54in 0.68in 0.48in",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "7.5px", letterSpacing: "0.46em", textTransform: "uppercase", color: plum, marginBottom: "0.26in", fontWeight: 600 }}>
            Brand Kit · Volume One
          </div>
          <h1 style={{
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            fontSize: "36px",
            lineHeight: 1.05,
            fontWeight: 500,
            color: plum,
            margin: 0,
            letterSpacing: "0",
          }}>
            {block.title}
          </h1>
          <div style={{ width: "0.98in", height: "1px", background: gold, margin: "0.3in auto 0.24in" }} />
          {block.subtitle ? (
            <div style={{ fontSize: "11px", color: branchProfile.textColor, opacity: 0.82, fontStyle: "italic" }}>
              {block.subtitle}
            </div>
          ) : null}
          {block.body ? (
            <p style={{ marginTop: "0.26in", fontSize: "9.5px", lineHeight: 1.65, color: branchProfile.textColor, maxWidth: "3.9in", marginLeft: "auto", marginRight: "auto" }}>
              {block.body}
            </p>
          ) : null}
        </div>
      </div>

      {/* Brand footer */}
      <div style={{ position: "absolute", bottom: "1.1in", left: "0.68in", right: "0.68in", height: "1px", background: gold, opacity: 0.65 }} />
      <div style={{ position: "absolute", bottom: "0.84in", left: "0.68in", right: "0.68in", display: "flex", justifyContent: "space-between", fontSize: "7.8px", letterSpacing: "0.22em", textTransform: "uppercase", color: plum, fontWeight: 600 }}>
        <span>{branchProfile.footerLabel}</span>
        <span>Est. 2026</span>
      </div>
    </PageCanvas>
  );
}