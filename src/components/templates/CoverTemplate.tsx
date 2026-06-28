import type { BranchProfile } from "@/lib/branch-profile";
import type { Block } from "@/lib/kit-types";
import {
  bodyOffsetStyle,
  bodyTextStyle,
  titleOffsetStyle,
  titleTextStyle,
} from "@/lib/layout-polish";
import { BasePage } from "./BasePage";
import {
  BotanicalSprig,
  CoverOrganicFrame,
  Diamond,
  KitFooterBand,
  RichText,
  SparkleRule,
} from "./_decor";

type Props = {
  block: Block;
  branchProfile: BranchProfile;
  pageNumber?: number;
  totalPages?: number;
};

export function CoverTemplate({ block, branchProfile, pageNumber, totalPages }: Props) {
  const lineAccent = branchProfile.lineAccentColor;
  const smallMark = branchProfile.smallMarkColor;
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
  const titleSize = titleLines.length <= 1 ? 138 : titleLines.length === 2 ? 108 : 86;

  return (
    <BasePage
      branchProfile={branchProfile}
      pageNumber={pageNumber}
      totalPages={totalPages}
      showFooter={false}
      bleed
    >
      <CoverOrganicFrame branchProfile={branchProfile} />

      <BotanicalSprig
        color={smallMark}
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
          top: "0.76in",
          left: "1.42in",
          right: "1.15in",
          bottom: "1.02in",
          textAlign: "center",
          color: branchProfile.primaryColor,
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

        <SparkleRule color={lineAccent} width="3.05in" marginTop="0.18in" marginBottom="0.2in" />

        <p
          style={{
            margin: "0 auto 0.62in",
            maxWidth: "3.7in",
            color: branchProfile.textColor,
            fontSize: "14px",
            lineHeight: 1.35,
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
          }}
        >
          <RichText text={block.subtitle} />
        </p>

        <h1
          style={{
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            lineHeight: 0.98,
            fontWeight: 500,
            color: branchProfile.primaryColor,
            margin: 0,
            letterSpacing: "0.005em",
            ...titleTextStyle(block, titleSize, "center"),
            ...titleOffsetStyle(block),
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
            margin: "0.34in auto 0.12in",
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
              background: lineAccent,
              opacity: 0.72,
            }}
          />
          <div
            style={{
              fontSize: "31px",
              letterSpacing: "0.38em",
              color: smallMark,
              fontWeight: 500,
            }}
          >
            KIT
          </div>
          <div
            style={{
              width: "1.15in",
              height: "1px",
              background: lineAccent,
              opacity: 0.72,
            }}
          />
        </div>

        <div style={bodyOffsetStyle(block)}>
          <Diamond color={smallMark} size={14} style={{ margin: "0 auto 0.2in" }} />

          <div
            style={{
              fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
              color: branchProfile.primaryColor,
              fontSize: "20px",
              fontStyle: "italic",
              fontWeight: 600,
              marginBottom: "0.24in",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.09in",
            }}
          >
            {(() => {
              const pillars = block.keywords ?? [];
              return pillars.map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.09in" }}
                >
                  {i > 0 ? <Diamond color={smallMark} size={9} inline /> : null}
                  <span>
                    <RichText text={word} />
                  </span>
                </span>
              ));
            })()}
          </div>

          {block.body ? (
            <p
              style={{
                margin: "0 auto",
                maxWidth: "4.1in",
                lineHeight: 1.58,
                color: branchProfile.textColor,
                fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
                ...bodyTextStyle(block, 16, "center"),
              }}
            >
              <RichText text={block.body} />
            </p>
          ) : null}
        </div>
      </main>

      <KitFooterBand
        branchProfile={branchProfile}
        pageNumber={pageNumber}
        totalPages={totalPages}
        label={block.footerLabel}
        showPageNumber={false}
        height="0.72in"
      />
    </BasePage>
  );
}
