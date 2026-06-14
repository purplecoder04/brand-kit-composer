import type { CSSProperties } from "react";
import type { BranchProfile } from "@/lib/branch-profile";

export const CREAM_PAPER = "#FAF4EA";
export const PAPER_PANEL = "#FFFDF8";

function shapeStrokeWidth(shapeWeight: BranchProfile["shapeWeight"], base = 1.25) {
  const multiplier =
    shapeWeight === "light-medium"
      ? 0.82
      : shapeWeight === "low-medium"
        ? 0.9
        : shapeWeight === "soft-medium" || shapeWeight === "medium-soft"
          ? 0.96
          : 1.08;
  return base * multiplier;
}

function shapeOpacity(branchProfile: BranchProfile, base: number) {
  return Math.min(1, Number((base * branchProfile.decorativeOpacity).toFixed(2)));
}

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

function LeafLine({
  color,
  opacity = 0.55,
  transform,
}: {
  color: string;
  opacity?: number;
  transform?: string;
}) {
  return (
    <g transform={transform} opacity={opacity}>
      <path d="M0 0 C 10 54 10 132 0 204" stroke={color} strokeWidth="1.05" fill="none" />
      {[28, 58, 91, 126, 160].map((y, index) => {
        const left = index % 2 === 0;
        const tipX = left ? -28 : 28;
        const ctrlX = left ? -43 : 43;
        return (
          <path
            key={y}
            d={`M0 ${y} C ${tipX} ${y - 15}, ${ctrlX} ${y + 8}, 0 ${y + 23} C ${left ? -12 : 12} ${y + 8}, ${left ? -13 : 13} ${y - 2}, 0 ${y} Z`}
            stroke={color}
            strokeWidth="0.8"
            fill="none"
          />
        );
      })}
    </g>
  );
}

/** Full-bleed organic cover artwork inspired by the reference image. */
export function CoverOrganicFrame({ branchProfile }: { branchProfile: BranchProfile }) {
  const {
    dominantShapeColor,
    secondaryShapeColor,
    softWashColor,
    lineAccentColor,
    smallMarkColor,
  } = branchProfile;
  const strokeWidth = shapeStrokeWidth(branchProfile.shapeWeight);

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
      <rect width="850" height="1100" fill={branchProfile.backgroundColor} />
      <path
        d="M0,0 L132,0 C166,112 146,204 112,304 C78,405 64,492 98,594 C132,696 126,784 95,884 C64,984 78,1042 132,1100 L0,1100 Z"
        fill={dominantShapeColor}
      />
      <path
        d="M118,0 C178,96 174,198 132,310 C92,419 92,508 132,620 C174,736 160,842 118,950 C92,1018 104,1068 152,1100 L72,1100 C36,998 54,910 90,818 C126,726 118,632 83,526 C45,411 70,316 104,226 C138,136 138,62 92,0 Z"
        fill={secondaryShapeColor}
        opacity={shapeOpacity(branchProfile, 0.78)}
      />
      <path
        d="M850,0 L850,1100 L770,1100 C724,1008 724,908 774,802 C822,698 830,610 792,506 C758,413 768,318 812,222 C848,144 832,70 770,0 Z"
        fill={secondaryShapeColor}
        opacity={shapeOpacity(branchProfile, 0.58)}
      />
      <path
        d="M850,210 C792,290 768,382 804,488 C840,594 820,690 772,792 C724,894 714,1004 758,1100 L850,1100 Z"
        fill={softWashColor}
        opacity={shapeOpacity(branchProfile, 0.88)}
      />
      <path
        d="M648,0 C722,86 742,170 716,258 C690,346 718,416 784,500 C846,578 840,650 774,732 C706,818 686,914 724,1020 C734,1050 748,1078 770,1100 L850,1100 L850,0 Z"
        fill={softWashColor}
        opacity={shapeOpacity(branchProfile, 0.45)}
      />
      <path
        d="M622,0 C706,72 750,156 728,250 C708,340 754,404 850,466 L850,0 Z"
        fill={PAPER_PANEL}
        opacity={shapeOpacity(branchProfile, 0.42)}
      />
      <path
        d="M88,0 C128,104 128,188 96,284 C62,384 54,480 92,586 C130,692 126,792 90,898 C62,982 66,1048 112,1100"
        fill="none"
        stroke={lineAccentColor}
        strokeWidth={strokeWidth * 1.25}
        opacity={0.95}
      />
      <path
        d="M786,0 C828,94 824,180 790,270 C752,370 756,470 798,578 C840,686 824,786 778,892 C742,976 742,1042 786,1100"
        fill="none"
        stroke={lineAccentColor}
        strokeWidth={strokeWidth}
        opacity={0.85}
      />
      <path
        d="M718,154 C752,244 744,328 706,418 C664,516 668,612 714,712 C758,808 750,910 704,1008"
        fill="none"
        stroke="#ffffff"
        strokeWidth={strokeWidth * 0.9}
        opacity={shapeOpacity(branchProfile, 0.62)}
      />
      <LeafLine
        color={lineAccentColor}
        opacity={shapeOpacity(branchProfile, 0.75)}
        transform="translate(86 505) rotate(-8)"
      />
      <LeafLine
        color={smallMarkColor}
        opacity={shapeOpacity(branchProfile, 0.42)}
        transform="translate(780 584) rotate(8)"
      />
      {[128, 360, 640, 890].map((y, index) => (
        <path
          key={y}
          d="M0 -5 L4 0 L0 5 L-4 0 Z"
          fill={index % 2 === 0 ? lineAccentColor : smallMarkColor}
          opacity={shapeOpacity(branchProfile, 0.78)}
          transform={`translate(${index % 2 === 0 ? 758 : 132} ${y})`}
        />
      ))}
    </svg>
  );
}

export function InteriorEditorialFrame({
  branchProfile,
  density = "quiet",
}: {
  branchProfile: BranchProfile;
  density?: "quiet" | "feature";
}) {
  const opacityBoost = density === "feature" ? 1.16 : 0.78;
  const strokeWidth = shapeStrokeWidth(branchProfile.shapeWeight, 0.95);

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
      <path
        d="M0,0 L92,0 C126,110 108,206 72,314 C34,424 36,514 76,618 C118,728 112,828 76,934 C44,1018 52,1070 88,1100 L0,1100 Z"
        fill={branchProfile.dominantShapeColor}
        opacity={shapeOpacity(branchProfile, 0.2 * opacityBoost)}
      />
      <path
        d="M72,0 C116,96 114,190 82,286 C48,386 48,486 86,594 C124,702 120,806 84,910 C58,988 58,1052 92,1100"
        fill="none"
        stroke={branchProfile.lineAccentColor}
        strokeWidth={strokeWidth}
        opacity={shapeOpacity(branchProfile, 0.58 * opacityBoost)}
      />
      <path
        d="M850,0 L850,1100 L766,1100 C724,1002 726,904 772,800 C818,696 822,608 786,506 C752,410 762,316 808,214 C842,138 830,72 766,0 Z"
        fill={branchProfile.softWashColor}
        opacity={shapeOpacity(branchProfile, 0.46 * opacityBoost)}
      />
      <path
        d="M792,0 C838,96 836,184 804,278 C768,384 776,478 814,580 C850,674 838,772 792,878 C754,968 754,1038 796,1100"
        fill="none"
        stroke={branchProfile.secondaryShapeColor}
        strokeWidth={strokeWidth}
        opacity={shapeOpacity(branchProfile, 0.48 * opacityBoost)}
      />
      {density === "feature" ? (
        <>
          <LeafLine
            color={branchProfile.lineAccentColor}
            opacity={shapeOpacity(branchProfile, 0.48)}
            transform="translate(92 650) rotate(-8)"
          />
          <LeafLine
            color={branchProfile.smallMarkColor}
            opacity={shapeOpacity(branchProfile, 0.28)}
            transform="translate(780 190) rotate(9)"
          />
        </>
      ) : null}
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
  const gold = branchProfile.lineAccentColor;
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
        background: `linear-gradient(90deg, ${branchProfile.footerBarColor}, ${branchProfile.secondaryShapeColor})`,
        borderTop: `1px solid ${gold}`,
        color: branchProfile.footerTextColor,
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
  const { softWashColor, secondaryShapeColor, dominantShapeColor, lineAccentColor } = branchProfile;
  const strokeWidth = shapeStrokeWidth(branchProfile.shapeWeight, 1.1);
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
            fill={softWashColor}
            opacity={shapeOpacity(branchProfile, 0.58)}
          />
          <path
            d="M0,0 L126,0 C144,82 88,144 44,216 C18,258 4,304 0,338 Z"
            fill={dominantShapeColor}
            opacity={shapeOpacity(branchProfile, 0.5)}
          />
          <path
            d="M24,238 C46,176 82,122 146,72"
            stroke={lineAccentColor}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.82}
          />
        </>
      )}
      {showTR && (
        <>
          <path
            d="M850,0 L586,0 C622,82 706,126 762,206 C812,278 838,342 850,394 Z"
            fill={softWashColor}
            opacity={shapeOpacity(branchProfile, 0.58)}
          />
          <path
            d="M850,0 L704,0 C754,78 782,138 770,216 C758,296 808,348 850,384 Z"
            fill={secondaryShapeColor}
            opacity={shapeOpacity(branchProfile, 0.76)}
          />
          <path
            d="M828,226 C810,162 774,112 708,66"
            stroke={lineAccentColor}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.82}
          />
        </>
      )}
      {showBL && (
        <>
          <path
            d="M0,1100 L0,780 C44,850 98,902 158,960 C220,1020 260,1066 284,1100 Z"
            fill={softWashColor}
            opacity={shapeOpacity(branchProfile, 0.5)}
          />
          <path
            d="M0,1100 L0,902 C34,938 72,978 118,1016 C164,1054 192,1082 208,1100 Z"
            fill={secondaryShapeColor}
            opacity={shapeOpacity(branchProfile, 0.68)}
          />
          <path
            d="M20,1016 C78,972 124,932 154,874"
            stroke={lineAccentColor}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.72}
          />
        </>
      )}
      {showBR && (
        <>
          <path
            d="M850,1100 L850,780 C806,850 752,902 692,960 C630,1020 590,1066 566,1100 Z"
            fill={softWashColor}
            opacity={shapeOpacity(branchProfile, 0.5)}
          />
          <path
            d="M850,1100 L850,902 C816,938 778,978 732,1016 C686,1054 658,1082 642,1100 Z"
            fill={dominantShapeColor}
            opacity={shapeOpacity(branchProfile, 0.42)}
          />
          <path
            d="M830,1016 C772,972 726,932 696,874"
            stroke={lineAccentColor}
            strokeWidth={strokeWidth}
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
