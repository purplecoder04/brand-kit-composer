import type { BranchProfile } from "@/lib/branch-profile";
import type { Block } from "@/lib/kit-types";
import { PageCanvas } from "../PageCanvas";
import { CornerWash, Diamond, PLUM_DEEP, SparkleRule } from "./_decor";

type Props = {
  block: Block;
  branchProfile: BranchProfile;
  pageNumber?: number;
  totalPages?: number;
};

export function TableTemplate({ block, branchProfile, pageNumber, totalPages }: Props) {
  const headers = block.tableData?.headers ?? [];
  const rows = block.tableData?.rows ?? [];
  const gold = branchProfile.goldAccent;

  return (
    <PageCanvas
      branchProfile={branchProfile}
      pageNumber={pageNumber}
      totalPages={totalPages}
      bleed
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "#F5EFE3" }} />
      <CornerWash branchProfile={branchProfile} variant="topRight" />
      <CornerWash branchProfile={branchProfile} variant="bottomLeft" />

      <div
        style={{
          position: "absolute",
          top: "0.6in",
          left: "0.6in",
          right: "0.6in",
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

        <SparkleRule color={gold} width="2in" marginTop="0.24in" marginBottom="0.4in" align="left" />

        <div style={{ width: "100%", maxWidth: "6.65in", marginLeft: "auto", marginRight: "auto" }}>
        <table
        style={{
          width: "100%",
          tableLayout: "fixed",
          borderCollapse: "collapse",
          fontSize: "12px",
          color: PLUM_DEEP,
          border: `1.5px solid ${PLUM_DEEP}`,
        }}
      >
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: "left",
                  background: PLUM_DEEP,
                  color: "#ffffff",
                  padding: "0.14in 0.18in",
                  fontSize: "11px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  borderRight:
                    i < headers.length - 1
                      ? `1px solid ${branchProfile.accentColor}`
                      : "none",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? "rgba(255,253,248,0.6)" : "transparent" }}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: "0.22in 0.18in",
                    borderBottom: `1px solid ${branchProfile.stoneColor}`,
                    borderRight:
                      ci < row.length - 1
                        ? `1px solid ${branchProfile.stoneColor}`
                        : "none",
                    verticalAlign: "top",
                    lineHeight: 1.55,
                  wordWrap: "break-word",
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
        </div>

        <div style={{ marginTop: "0.35in", display: "flex", alignItems: "center", gap: "0.12in" }}>
          <Diamond color={gold} inline />
          <div style={{ flex: 1, height: "1px", background: gold, opacity: 0.5, maxWidth: "1.2in" }} />
        </div>
      </div>
    </PageCanvas>
  );
}