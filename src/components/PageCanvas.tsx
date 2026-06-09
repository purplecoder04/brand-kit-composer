import { useEffect, useRef, useState, type ReactNode } from "react";
import type { BranchProfile } from "@/lib/branch-profile";

type PageCanvasProps = {
  branchProfile: BranchProfile;
  pageNumber?: number;
  totalPages?: number;
  showFooter?: boolean;
  bleed?: boolean;
  children: ReactNode;
};

const PAGE_PADDING = "0.6in";
const FOOTER_HEIGHT = "0.45in";

export function PageCanvas({
  branchProfile,
  pageNumber,
  totalPages,
  showFooter = true,
  bleed = false,
  children,
}: PageCanvasProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const check = () => {
      setOverflow(el.scrollHeight - el.clientHeight > 2);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    const mo = new MutationObserver(check);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  return (
    <div
      className="page-canvas relative"
      style={{
        width: "8.5in",
        height: "11in",
        backgroundColor: branchProfile.backgroundColor,
        color: branchProfile.textColor,
        boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)",
        fontFamily: "var(--font-body, Inter, system-ui, sans-serif)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {!bleed && overflow ? (
        <div
          className="overflow-warning"
          style={{
            position: "absolute",
            top: "0.25in",
            right: "0.25in",
            background: "#7a1f1f",
            color: "#ffffff",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            padding: "4px 10px",
            borderRadius: "999px",
            zIndex: 10,
          }}
        >
          Content may exceed page height
        </div>
      ) : null}

      {bleed ? (
        <div style={{ position: "absolute", inset: 0 }}>{children}</div>
      ) : (
        <div
          ref={contentRef}
          data-page-content
          style={{
            position: "absolute",
            top: PAGE_PADDING,
            left: PAGE_PADDING,
            right: PAGE_PADDING,
            bottom: showFooter
              ? `calc(${PAGE_PADDING} + ${FOOTER_HEIGHT})`
              : PAGE_PADDING,
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      )}

      {showFooter ? (
        <div
          style={{
            position: "absolute",
            left: PAGE_PADDING,
            right: PAGE_PADDING,
            bottom: PAGE_PADDING,
            height: FOOTER_HEIGHT,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              height: "1px",
              background: branchProfile.goldAccent,
              marginBottom: "0.12in",
              opacity: 0.85,
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: branchProfile.primaryColor,
            }}
          >
            <span>{branchProfile.footerLabel}</span>
            {typeof pageNumber === "number" && typeof totalPages === "number" ? (
              <span>
                {pageNumber} / {totalPages}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}