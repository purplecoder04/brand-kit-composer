import type { BranchProfile } from "@/lib/branch-profile";
import type { Block } from "@/lib/kit-types";
import { PageCanvas } from "../PageCanvas";
import {
  BotanicalSprig,
  CoverOrganicFrame,
  Diamond,
  KitFooterBand,
  PLUM_DEEP,
  SparkleRule,
  TEXT_INK,
} from "./_decor";

type Props = {
  block: Block;
  branchProfile: BranchProfile;
  pageNumber?: number;
  totalPages?: number;
};

export function CoverTemplate({ block, branchProfile, pageNumber, totalPages }: Props) {
  const gold = branchProfile.goldAccent;
  const titleLines =
    block.title === "Get Your Business Straight"
      ? ["Get Your", "Business", "Straight"]
      : block.title.split(/\s+/).reduce<string[]>(
          (lines, word) => {
            const current = lines[lines.length - 1] ?? "";
            if (!current || `${current} ${word}`.length <= 12)
              lines[lines.length - 1] = current ? `${current} ${word}` : word;
            else lines.push(word);
            return lines;
          },
          [""],
        );

  return (
    <PageCanvas
      branchProfile={branchProfile}
      pageNumber={pageNumber}
      totalPages={totalPages}
      showFooter={false}
      bleed
    >
      <CoverOrganicFrame branchProfile={branchProfile} />

      <BotanicalSprig
        color={gold}
        width="1.7in"
        height="3.95in"
        style={{
          position: "absolute",
          left: "0.45in",
          top: "3.22in",
          transform: "rotate(-12deg)",
          opacity: 0.95,
        }}
      />

      <main
        style={{
          position: "absolute",
          top: "0.78in",
          left: "1.42in",
          right: "1.15in",
          bottom: "1.02in",
          textAlign: "center",
          color: PLUM_DEEP,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            fontSize: "52px",
            lineHeight: 1,
            fontWeight: 500,
            letterSpacing: "0",
          }}
        >
          Best Collective
        </div>

        <SparkleRule
          color={branchProfile.accentColor}
          width="3.05in"
          marginTop="0.18in"
          marginBottom="0.2in"
        />

        <p
          style={{
            margin: "0 auto 0.58in",
            maxWidth: "3.7in",
            color: TEXT_INK,
            fontSize: "14px",
            lineHeight: 1.35,
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
          }}
        >
          Helping people build stronger brands,
          <br />
          with confidence and clarity.
        </p>

        <h1
          style={{
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            fontSize: "76px",
            lineHeight: 0.93,
            fontWeight: 500,
            color: PLUM_DEEP,
            margin: 0,
            letterSpacing: "0",
          }}
        >
          {titleLines.map((line) => (
            <span key={line} style={{ display: "block" }}>
              {line}
            </span>
          ))}
        </h1>

        <div
          style={{
            margin: "0.38in auto 0.12in",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.26in",
          }}
        >
          <div
            style={{
              width: "1.15in",
              height: "1px",
              background: branchProfile.accentColor,
              opacity: 0.72,
            }}
          />
          <div
            style={{
              fontSize: "31px",
              letterSpacing: "0.38em",
              color: branchProfile.accentColor,
              fontWeight: 500,
            }}
          >
            KIT
          </div>
          <div
            style={{
              width: "1.15in",
              height: "1px",
              background: branchProfile.accentColor,
              opacity: 0.72,
            }}
          />
        </div>

        <Diamond color={gold} size={14} style={{ margin: "0 auto 0.2in" }} />

        <div
          style={{
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            color: PLUM_DEEP,
            fontSize: "20px",
            fontStyle: "italic",
            fontWeight: 600,
            marginBottom: "0.24in",
          }}
        >
          Structure <span style={{ color: gold, padding: "0 0.09in" }}>◆</span> Legitimacy{" "}
          <span style={{ color: gold, padding: "0 0.09in" }}>◆</span> Foundation
        </div>

        {block.body ? (
          <p
            style={{
              margin: "0 auto",
              maxWidth: "4.1in",
              fontSize: "15px",
              lineHeight: 1.62,
              color: TEXT_INK,
            }}
          >
            {block.body}
          </p>
        ) : null}
      </main>

      <KitFooterBand
        branchProfile={branchProfile}
        pageNumber={pageNumber}
        totalPages={totalPages}
        label="A Best Collective Brand Kit"
        showPageNumber={false}
        height="0.72in"
      />
    </PageCanvas>
  );
}
