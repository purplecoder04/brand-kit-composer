import type { BranchProfile } from "@/lib/branch-profile";

export const PLUM_DEEP = "#3A1F4F";

export function Diamond({
  color,
  size = 8,
  inline = false,
  style,
}: {
  color: string;
  size?: number;
  inline?: boolean;
  style?: React.CSSProperties;
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
  style?: React.CSSProperties;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 220"
      style={{ width, height, ...style }}
    >
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

/** Subtle plum/lilac/blush corner wash for interior pages — full-bleed when used inside a `bleed` canvas. */
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
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      {showTL && (
        <>
          <path d="M0,0 L260,0 C220,90 150,140 90,210 C40,270 10,330 0,360 Z" fill={lilacColor} opacity={0.55} />
          <path d="M0,0 L150,0 C130,70 70,110 30,170 C10,210 0,240 0,250 Z" fill={primaryColor} opacity={0.55} />
          <path d="M20,180 C40,140 80,110 120,80" stroke={goldAccent} strokeWidth="1" fill="none" opacity={0.7} />
        </>
      )}
      {showTR && (
        <>
          <path d="M850,0 L600,0 C640,90 720,140 770,210 C810,270 840,330 850,360 Z" fill={blushColor} opacity={0.55} />
          <path d="M850,0 L720,0 C740,70 790,110 820,170 C840,210 850,240 850,250 Z" fill={stoneColor} opacity={0.7} />
          <path d="M830,180 C810,140 770,110 730,80" stroke={goldAccent} strokeWidth="1" fill="none" opacity={0.7} />
        </>
      )}
      {showBL && (
        <>
          <path d="M0,1100 L0,820 C40,860 90,920 140,970 C200,1030 240,1070 260,1100 Z" fill={blushColor} opacity={0.5} />
          <path d="M0,1100 L0,900 C30,930 70,970 110,1010 C150,1050 170,1080 180,1100 Z" fill={stoneColor} opacity={0.65} />
        </>
      )}
      {showBR && (
        <>
          <path d="M850,1100 L850,820 C810,860 760,920 710,970 C650,1030 610,1070 590,1100 Z" fill={lilacColor} opacity={0.5} />
          <path d="M850,1100 L850,900 C820,930 780,970 740,1010 C700,1050 680,1080 670,1100 Z" fill={primaryColor} opacity={0.45} />
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