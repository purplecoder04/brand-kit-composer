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
  const plumDeep = "#3A1F4F";
  const lilac = branchProfile.lilacColor;
  const blush = branchProfile.blushColor;
  const stone = "#C8B8A6";
  const stoneLight = "#E2D5C2";
  const cream = "#F5EFE3";
  const gold = branchProfile.goldAccent;

  return (
    <PageCanvas
      branchProfile={branchProfile}
      pageNumber={pageNumber}
      totalPages={totalPages}
      showFooter={false}
      bleed
    >
      {/* Cream base */}
      <div aria-hidden style={{ position: "absolute", inset: 0, background: cream }} />

      {/* Flowing organic shapes — viewBox 850 x 1100 matches 8.5 x 11 inches */}
      <svg
        aria-hidden
        viewBox="0 0 850 1100"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        {/* LEFT side — layered waves */}
        {/* Deep plum back */}
        <path
          d="M0,0 L150,0 C140,140 200,260 175,400 C150,540 220,650 195,790 C175,900 230,1000 200,1100 L0,1100 Z"
          fill={plumDeep}
        />
        {/* Lilac mid */}
        <path
          d="M0,0 L95,0 C115,150 70,300 105,450 C140,600 75,760 110,910 C135,1010 90,1080 95,1100 L0,1100 Z"
          fill={lilac}
          opacity={0.95}
        />
        {/* Plum accent ribbon */}
        <path
          d="M55,0 L120,0 C100,180 160,340 130,520 C100,700 165,860 130,1040 L75,1100 L0,1100 L0,1080 C30,940 -10,780 35,620 C75,460 10,300 55,140 Z"
          fill={plum}
          opacity={0.7}
        />
        {/* Thin gold ribbon line on left */}
        <path
          d="M75,40 C95,220 50,400 90,580 C130,760 70,940 95,1080"
          stroke={gold}
          strokeWidth="1.2"
          fill="none"
          opacity={0.7}
        />

        {/* RIGHT side — layered waves */}
        {/* Stone back */}
        <path
          d="M850,0 L700,0 C720,120 670,240 700,360 C730,490 680,620 710,760 C735,900 685,1010 720,1100 L850,1100 Z"
          fill={stone}
        />
        {/* Blush mid */}
        <path
          d="M850,0 L760,0 C740,150 790,290 760,440 C730,600 790,750 760,900 C740,1010 770,1080 770,1100 L850,1100 Z"
          fill={blush}
          opacity={0.85}
        />
        {/* Stone light highlight */}
        <path
          d="M850,0 L820,0 C800,140 830,300 810,460 C790,620 825,790 800,950 C780,1050 815,1090 815,1100 L850,1100 Z"
          fill={stoneLight}
          opacity={0.9}
        />
        {/* Thin gold ribbon line on right */}
        <path
          d="M770,50 C745,240 790,420 760,610 C730,790 780,960 760,1080"
          stroke={gold}
          strokeWidth="1.2"
          fill="none"
          opacity={0.7}
        />

        {/* Bottom plum bar */}
        <rect x="0" y="1030" width="850" height="70" fill={plumDeep} />
      </svg>

      {/* Gold botanical sprig — left */}
      <svg
        aria-hidden
        viewBox="0 0 100 220"
        style={{ position: "absolute", left: "0.85in", top: "4.3in", width: "0.85in", height: "1.9in" }}
      >
        <path d="M50 10 C 50 60 50 140 50 210" stroke={gold} strokeWidth="1.2" fill="none" />
        {[30, 60, 95, 130, 165].map((y, i) => (
          <g key={i}>
            <path
              d={`M50 ${y} C ${i % 2 === 0 ? 20 : 80} ${y - 12}, ${i % 2 === 0 ? 14 : 86} ${y + 6}, 50 ${y + 14}`}
              stroke={gold}
              strokeWidth="1"
              fill="none"
            />
            <path
              d={`M${i % 2 === 0 ? 22 : 78} ${y - 4} Q ${i % 2 === 0 ? 8 : 92} ${y}, ${i % 2 === 0 ? 26 : 74} ${y + 12} Q 50 ${y + 6}, ${i % 2 === 0 ? 22 : 78} ${y - 4} Z`}
              fill="none"
              stroke={gold}
              strokeWidth="0.8"
              opacity={0.9}
            />
          </g>
        ))}
      </svg>

      {/* Centered content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "1.05in 1.45in 1.4in",
          textAlign: "center",
        }}
      >
        {/* Top brand line */}
        <div
          style={{
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            fontSize: "44px",
            lineHeight: 1,
            color: plumDeep,
            letterSpacing: "0.005em",
            fontWeight: 500,
          }}
        >
          Best Collective
        </div>

        {/* gold sparkle divider */}
        <SparkleRule color={gold} width="2.4in" marginTop="0.18in" />

        <div
          style={{
            marginTop: "0.18in",
            fontSize: "13px",
            lineHeight: 1.55,
            color: plumDeep,
            opacity: 0.85,
            maxWidth: "3.4in",
          }}
        >
          Helping people build stronger brands, with confidence and clarity.
        </div>

        {/* Main title */}
        <h1
          style={{
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            fontSize: "78px",
            lineHeight: 1.0,
            fontWeight: 500,
            color: plumDeep,
            margin: "0.65in 0 0",
            letterSpacing: "-0.01em",
            maxWidth: "5.2in",
          }}
        >
          {block.title}
        </h1>

        {/* KIT badge */}
        <div
          style={{
            marginTop: "0.32in",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.18in",
          }}
        >
          <div style={{ width: "0.9in", height: "1px", background: plum, opacity: 0.5 }} />
          <div
            style={{
              fontSize: "20px",
              letterSpacing: "0.5em",
              color: lilac,
              fontWeight: 500,
              paddingLeft: "0.05in",
            }}
          >
            KIT
          </div>
          <div style={{ width: "0.9in", height: "1px", background: plum, opacity: 0.5 }} />
        </div>

        <Diamond color={gold} marginTop="0.18in" />

        {/* Pillars */}
        <div
          style={{
            marginTop: "0.22in",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.18in",
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            fontStyle: "italic",
            fontSize: "18px",
            color: plumDeep,
          }}
        >
          <span>Structure</span>
          <Diamond color={gold} inline />
          <span>Legitimacy</span>
          <Diamond color={gold} inline />
          <span>Foundation</span>
        </div>

        {/* Body copy */}
        {block.body ? (
          <p
            style={{
              marginTop: "0.28in",
              fontSize: "13px",
              lineHeight: 1.7,
              color: plumDeep,
              maxWidth: "3.6in",
            }}
          >
            {block.body}
          </p>
        ) : null}
      </div>

      {/* Bottom plum bar caption */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "0.7in",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#F5EFE3",
          fontSize: "11px",
          letterSpacing: "0.36em",
          textTransform: "uppercase",
        }}
      >
        A Best Collective Brand Kit
      </div>
    </PageCanvas>
  );
}

function SparkleRule({
  color,
  width,
  marginTop,
}: {
  color: string;
  width: string;
  marginTop?: string;
}) {
  return (
    <div
      style={{
        marginTop,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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

function Diamond({
  color,
  inline = false,
  marginTop,
}: {
  color: string;
  inline?: boolean;
  marginTop?: string;
}) {
  const size = 8;
  const dot = (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden>
      <path d="M5 0 L7 3 L10 5 L7 7 L5 10 L3 7 L0 5 L3 3 Z" fill={color} />
    </svg>
  );
  if (inline) return dot;
  return <div style={{ marginTop, display: "flex", justifyContent: "center" }}>{dot}</div>;
}