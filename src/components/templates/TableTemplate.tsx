import type { BranchProfile } from "@/lib/branch-profile";
import type { Block } from "@/lib/kit-types";
import { PageCanvas } from "../PageCanvas";

type Props = {
  block: Block;
  branchProfile: BranchProfile;
  pageNumber?: number;
  totalPages?: number;
};

export function TableTemplate({ block, branchProfile, pageNumber, totalPages }: Props) {
  const headers = block.tableData?.headers ?? [];
  const rows = block.tableData?.rows ?? [];

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

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px",
          color: branchProfile.textColor,
        }}
      >
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: "left",
                  background: branchProfile.primaryColor,
                  color: "#ffffff",
                  padding: "0.14in 0.18in",
                  fontSize: "11px",
                  letterSpacing: "0.16em",
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
            <tr key={ri}>
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
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </PageCanvas>
  );
}