import type { CSSProperties } from "react";
import type { BranchProfile } from "@/lib/branch-profile";

export const PLUM_DEEP = "#2F1746";
export const CREAM_PAPER = "#FAF4EA";
export const PAPER_PANEL = "#FFFDF8";
export const TEXT_INK = "#28242C";

export function Diamond({
  color,
  size = 8,
  inline = false,
  style,
}: {
  color: string;
  size?: number;
  inline?: boolean;
  style?: CSSProperties;
}) {
  const svg = (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden style={style}>
      <path d="M5 0 L7 3 L10 5 L7 7 L5 10 L3 7 L0 5 L3 3 Z" fill={color} />
    </svg>
  );
  if (inline) return svg;
  return <div style={{ display: "flex", justifyContent: "center" }}>{svg}</div>;
}

export function SparkleRule({
  color,
  width = "2.2in",
  marginTop,
  marginBottom,
  align = "center",
}: {
  color: string;
  width?: string;
  marginTop?: string;
  marginBottom?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      style={{
        marginTop,
        marginBottom,
        marginLeft: align === "center" ? "auto" : undefined,
        marginRight: align === "center" ? "auto" : undefined,
        display: "flex",
        alignItems: "center",
        gap: "0.1in",
        width,
      }}
    >
      <div style={{ flex: 1, height: "1px", background: color, opacity: 0.7 }} />
      <Diamond color={color} inline />
      <div style={{ flex: 1, height: "1px", background: color, opacity: 0.7 }} />
    </div>
  );
}

/** Small gold botanical sprig (vertical stem with leaves). */
export function BotanicalSprig({
  color,
  width = "0.55in",
  height = "1.3in",
  style,
}: {
  color: string;
  width?: string;
  height?: string;
  style?: CSSProperties;
}) {
  return (
    <svg aria-hidden viewBox="0 0 100 220" style={{ width, height, ...style }}>
      <path d="M50 10 C 50 60 50 140 50 210" stroke={color} strokeWidth="1.2" fill="none" />
      {[35, 75, 120, 165].map((y, i) => {
        const left = i % 2 === 0;
        const xTip = left ? 14 : 86;
        const xCtrl = left ? 8 : 92;
        const xMid = left ? 26 : 74;
        return (
          <g key={i}>
            <path
              d={`M50 ${y} C ${left ? 22 : 78} ${y - 12}, ${xTip} ${y + 6}, 50 ${y + 14}`}
              stroke={color}
              strokeWidth="1"
              fill="none"
            />
            <path
              d={`M${left ? 22 : 78} ${y - 4} Q ${xCtrl} ${y}, ${xMid} ${y + 12} Q 50 ${y + 6}, ${left ? 22 : 78} ${y - 4} Z`}
              fill="none"
              stroke={color}
              strokeWidth="0.8"
              opacity={0.9}
            />
          </g>
        );
      })}
    </svg>
  );
}

/** Full-bleed organic cover artwork inspired by the reference image. */
export function CoverOrganicFrame({ branchProfile }: { branchProfile: BranchProfile }) {
  const plum = PLUM_DEEP;
  const { lilacColor, blushColor, stoneColor, goldAccent } = branchProfile;

  return (
    <svg
      aria-hidden
      viewBox="0 0 850 1100"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <rect width="850" height="1100" fill={CREAM_PAPER} />
      <path
        d="M0,0 C78,150 142,245 102,380 C68,494 34,590 92,720 C142,832 228,896 344,934 C426,960 474,1002 506,1100 L0,1100 Z"
        fill={plum}
      />
      <path
        d="M45,0 C92,120 146,206 136,318 C126,426 68,514 92,638 C118,774 234,827 274,911 C143,836 68,747 38,622 C12,516 54,414 60,326 C68,214 28,104 0,0 Z"
        fill={lilacColor}
        opacity={0.78}
      />
      <path
        d="M850,0 L850,375 C795,317 750,270 756,190 C762,104 720,48 648,0 Z"
        fill={stoneColor}
        opacity={0.82}
      />
      <path
        d="M850,292 C792,382 760,475 790,594 C822,720 768,835 668,923 C596,985 566,1042 548,1100 L850,1100 Z"
        fill={stoneColor}
        opacity={0.72}
      />
      <path
        d="M850,362 C802,408 764,486 778,590 C790,682 745,767 680,836 C686,710 638,654 666,548 C698,424 780,380 850,362 Z"
        fill={blushColor}
        opacity={0.78}
      />
      <path
        d="M620,0 C704,72 746,150 724,248 C704,338 752,402 850,466 L850,0 Z"
        fill={PAPER_PANEL}
        opacity={0.72}
      />
      <path
        d="M0,128 C52,228 76,310 53,412 C25,536 24,660 86,767 C143,866 210,906 334,943 C408,965 457,1014 488,1100"
        fill="none"
        stroke={goldAccent}
        strokeWidth="2"
        opacity={0.95}
      />
      <path
        d="M724,0 C770,66 790,138 775,219 C760,306 798,368 850,423"
        fill="none"
        stroke={goldAccent}
        strokeWidth="1.5"
        opacity={0.85}
      />
      <path
        d="M696,852 C742,768 750,690 728,612 C700,510 742,421 850,336"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.4"
        opacity={0.7}
      />
    </svg>
  );
}

export function KitFooterBand({
  branchProfile,
  pageNumber,
  totalPages,
  label,
  showPageNumber = true,
  height = "0.62in",
}: {
  branchProfile: BranchProfile;
  pageNumber?: number;
  totalPages?: number;
  label?: string;
  showPageNumber?: boolean;
  height?: string;
}) {
  const gold = branchProfile.goldAccent;
  const footerText = label ?? branchProfile.footerLabel;

  return (
    <div
      className="brand-decoration"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height,
        background: `linear-gradient(90deg, ${PLUM_DEEP}, ${branchProfile.primaryColor})`,
        borderTop: `1px solid ${gold}`,
        color: CREAM_PAPER,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "0.62in",
          right: "0.62in",
          top: "0.18in",
          display: "flex",
          alignItems: "center",
          justifyContent: showPageNumber ? "space-between" : "center",
          gap: "0.2in",
          fontSize: "8px",
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        <span>{footerText}</span>
        {showPageNumber && typeof pageNumber === "number" && typeof totalPages === "number" ? (
          <span>
            {pageNumber} / {totalPages}
          </span>
        ) : null}
      </div>
      <div
        style={{
          position: "absolute",
          left: "0.16in",
          right: "0.16in",
          bottom: "0.15in",
          display: "flex",
          alignItems: "center",
          gap: "0.14in",
        }}
      >
        <div style={{ flex: 1, height: "1px", background: gold }} />
        <Diamond color={gold} inline size={12} />
        <div style={{ flex: 1, height: "1px", background: gold }} />
      </div>
    </div>
  );
}

/** Subtle plum/lilac/blush organic washes for interior pages — full-bleed when used inside a `bleed` canvas. */
export function CornerWash({
  branchProfile,
  variant = "topRight",
}: {
  branchProfile: BranchProfile;
  variant?: "topRight" | "topLeft" | "bottomLeft" | "bottomRight" | "both";
}) {
  const { lilacColor, blushColor, stoneColor, primaryColor, goldAccent } = branchProfile;
  const showTL = variant === "topLeft" || variant === "both";
  const showTR = variant === "topRight" || variant === "both";
  const showBL = variant === "bottomLeft" || variant === "both";
  const showBR = variant === "bottomRight" || variant === "both";
  return (
    <svg
      aria-hidden
      viewBox="0 0 850 1100"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {showTL && (
        <>
          <path
            d="M0,0 L276,0 C226,86 162,124 114,202 C60,290 28,350 0,392 Z"
            fill={lilacColor}
            opacity={0.58}
          />
          <path
            d="M0,0 L126,0 C144,82 88,144 44,216 C18,258 4,304 0,338 Z"
            fill={primaryColor}
            opacity={0.5}
          />
          <path
            d="M24,238 C46,176 82,122 146,72"
            stroke={goldAccent}
            strokeWidth="1.25"
            fill="none"
            opacity={0.82}
          />
        </>
      )}
      {showTR && (
        <>
          <path
            d="M850,0 L586,0 C622,82 706,126 762,206 C812,278 838,342 850,394 Z"
            fill={blushColor}
            opacity={0.58}
          />
          <path
            d="M850,0 L704,0 C754,78 782,138 770,216 C758,296 808,348 850,384 Z"
            fill={stoneColor}
            opacity={0.76}
          />
          <path
            d="M828,226 C810,162 774,112 708,66"
            stroke={goldAccent}
            strokeWidth="1.25"
            fill="none"
            opacity={0.82}
          />
        </>
      )}
      {showBL && (
        <>
          <path
            d="M0,1100 L0,780 C44,850 98,902 158,960 C220,1020 260,1066 284,1100 Z"
            fill={blushColor}
            opacity={0.5}
          />
          <path
            d="M0,1100 L0,902 C34,938 72,978 118,1016 C164,1054 192,1082 208,1100 Z"
            fill={stoneColor}
            opacity={0.68}
          />
          <path
            d="M20,1016 C78,972 124,932 154,874"
            stroke={goldAccent}
            strokeWidth="1.1"
            fill="none"
            opacity={0.72}
          />
        </>
      )}
      {showBR && (
        <>
          <path
            d="M850,1100 L850,780 C806,850 752,902 692,960 C630,1020 590,1066 566,1100 Z"
            fill={lilacColor}
            opacity={0.5}
          />
          <path
            d="M850,1100 L850,902 C816,938 778,978 732,1016 C686,1054 658,1082 642,1100 Z"
            fill={primaryColor}
            opacity={0.42}
          />
          <path
            d="M830,1016 C772,972 726,932 696,874"
            stroke={goldAccent}
            strokeWidth="1.1"
            fill="none"
            opacity={0.72}
          />
        </>
      )}
    </svg>
  );
}

/** Top brand strip used on interior pages: eyebrow text + gold rule. */
export function PageHeader({
  label,
  color,
  goldColor,
}: {
  label: string;
  color: string;
  goldColor: string;
}) {
  return (
    <div style={{ marginBottom: "0.32in" }}>
      <div
        style={{
          fontSize: "10px",
          letterSpacing: "0.36em",
          textTransform: "uppercase",
          color,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: "0.08in",
          display: "flex",
          alignItems: "center",
          gap: "0.08in",
        }}
      >
        <div style={{ width: "0.55in", height: "1px", background: goldColor }} />
        <Diamond color={goldColor} inline />
      </div>
    </div>
  );
}
