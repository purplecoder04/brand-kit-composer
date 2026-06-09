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
  return (
    <PageCanvas
      branchProfile={branchProfile}
      pageNumber={pageNumber}
      totalPages={totalPages}
      showFooter={false}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-1.5in",
          right: "-1.5in",
          width: "4.5in",
          height: "4.5in",
          borderRadius: "50%",
          background: branchProfile.accentColor,
          opacity: 0.18,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "-1.2in",
          left: "-1.2in",
          width: "3.5in",
          height: "3.5in",
          borderRadius: "50%",
          background: branchProfile.stoneColor,
          opacity: 0.5,
        }}
      />

      <div
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingRight: "0.4in",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: branchProfile.primaryColor,
            marginBottom: "0.4in",
          }}
        >
          Best Collective | {branchProfile.name}
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
            fontSize: "64px",
            lineHeight: 1.05,
            fontWeight: 500,
            color: branchProfile.primaryColor,
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {block.title}
        </h1>

        <div
          style={{
            width: "1.4in",
            height: "2px",
            background: branchProfile.goldAccent,
            margin: "0.4in 0",
          }}
        />

        {block.subtitle ? (
          <div
            style={{
              fontSize: "18px",
              color: branchProfile.textColor,
              opacity: 0.85,
              marginBottom: "0.3in",
              fontStyle: "italic",
            }}
          >
            {block.subtitle}
          </div>
        ) : null}

        {block.body ? (
          <p
            style={{
              fontSize: "14px",
              lineHeight: 1.7,
              color: branchProfile.textColor,
              maxWidth: "5in",
              margin: 0,
            }}
          >
            {block.body}
          </p>
        ) : null}

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            fontSize: "10px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: branchProfile.primaryColor,
          }}
        >
          {branchProfile.footerLabel}
        </div>
      </div>
    </PageCanvas>
  );
}