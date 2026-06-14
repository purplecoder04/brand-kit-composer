import type { BranchProfile } from "@/lib/branch-profile";
import type { Block } from "@/lib/kit-types";
import { PageCanvas } from "../PageCanvas";
import {
  CornerWash,
  Diamond,
  InteriorEditorialFrame,
  KitFooterBand,
  PAPER_PANEL,
  SparkleRule,
} from "./_decor";

type Props = {
  block: Block;
  branchProfile: BranchProfile;
  pageNumber?: number;
  totalPages?: number;
};

export function TableTemplate({ block, branchProfile, pageNumber, totalPages }: Props) {
  const headers = block.tableData?.headers ?? [];
  const rows = block.tableData?.rows ?? [];
  const lineAccent = branchProfile.lineAccentColor;
  const smallMark = branchProfile.smallMarkColor;

  return (
    <PageCanvas
      branchProfile={branchProfile}
      pageNumber={pageNumber}
      totalPages={totalPages}
      showFooter={false}
      bleed
    >
      <InteriorEditorialFrame branchProfile={branchProfile} />
      <CornerWash branchProfile={branchProfile} variant="topRight" />
      <CornerWash branchProfile={branchProfile} variant="bottomLeft" />

      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "0.62in",
          top: "0.62in",
          width: "2.1in",
          height: "1px",
          background: lineAccent,
          opacity: 0.72,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "0.86in",
          left: "0.72in",
          right: "0.72in",
          bottom: "1in",
        }}
      >
        {block.subtitle ? (
          <div
            style={{
              fontSize: "10px",
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              color: branchProfile.primaryColor,
              fontWeight: 600,
              marginBottom: "0.16in",
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
            color: branchProfile.primaryColor,
            margin: 0,
            letterSpacing: "0",
          }}
        >
          {block.title}
        </h1>

        <SparkleRule
          color={lineAccent}
          width="2in"
          marginTop="0.24in"
          marginBottom="0.34in"
          align="left"
        />

        <div
          className="kit-table-wrap"
          style={{
            width: "100%",
            maxWidth: "6.65in",
            marginLeft: "auto",
            marginRight: "auto",
            boxSizing: "border-box",
            background: PAPER_PANEL,
            border: `2px solid ${branchProfile.tableHeaderColor}`,
            boxShadow: "0 12px 24px rgba(40, 36, 44, 0.08)",
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              tableLayout: "fixed",
              borderCollapse: "separate",
              borderSpacing: 0,
              fontSize: "13px",
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
                      background: branchProfile.tableHeaderColor,
                      color: PAPER_PANEL,
                      padding: "0.18in 0.2in",
                      fontSize: "11px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      borderRight:
                        i < headers.length - 1
                          ? `1px solid ${branchProfile.lineAccentColor}`
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
                <tr
                  key={ri}
                  style={{ background: ri % 2 === 0 ? "rgba(250,244,234,0.72)" : PAPER_PANEL }}
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      style={{
                        padding: "0.24in 0.2in",
                        borderTop:
                          ri === 0 ? `1px solid ${branchProfile.worksheetLineColor}` : "none",
                        borderBottom:
                          ri < rows.length - 1
                            ? `1px solid ${branchProfile.worksheetLineColor}`
                            : "none",
                        borderRight:
                          ci < row.length - 1
                            ? `1px solid ${branchProfile.worksheetLineColor}`
                            : "none",
                        verticalAlign: "top",
                        lineHeight: 1.6,
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
          <Diamond color={smallMark} inline />
          <div
            style={{
              flex: 1,
              height: "1px",
              background: lineAccent,
              opacity: 0.5,
              maxWidth: "1.2in",
            }}
          />
        </div>
      </div>
      <KitFooterBand
        branchProfile={branchProfile}
        pageNumber={pageNumber}
        totalPages={totalPages}
      />
    </PageCanvas>
  );
}
