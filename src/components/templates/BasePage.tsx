import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { BranchProfile } from "@/lib/branch-profile";
import "../../print.css";

type BasePageProps = {
  branchProfile: BranchProfile;
  pageNumber?: number;
  totalPages?: number;
  showFooter?: boolean;
  bleed?: boolean;
  children: ReactNode;
};

const PAGE_PADDING = "0.6in";
const FOOTER_HEIGHT = "0.45in";

export function BasePage({
  branchProfile,
  pageNumber,
  totalPages,
  showFooter = true,
  bleed = false,
  children,
}: BasePageProps) {
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
      className="base-page page-canvas relative"
      style={
        {
          "--bc-page-background": branchProfile.backgroundColor,
          "--bc-page-text": branchProfile.textColor,
          "--bc-page-line": branchProfile.lineAccentColor,
          "--bc-page-footer": branchProfile.footerBarColor,
          backgroundColor: branchProfile.backgroundColor,
          color: branchProfile.textColor,
          backgroundImage: `
            radial-gradient(circle at 18% 22%, rgba(255,255,255,0.5) 0 0.7px, transparent 0.8px),
            radial-gradient(circle at 72% 38%, rgba(40,36,44,0.04) 0 0.6px, transparent 0.8px),
            linear-gradient(135deg, rgba(255,255,255,0.28), rgba(40,36,44,0.018))
          `,
          backgroundSize: "8px 8px, 11px 11px, 100% 100%",
          fontFamily: "var(--font-body, Inter, system-ui, sans-serif)",
        } as CSSProperties
      }
    >
      {!bleed && overflow ? (
        <div className="base-page__overflow-warning">Content may exceed page height</div>
      ) : null}

      {bleed ? (
        <div className="base-page__bleed">{children}</div>
      ) : (
        <div
          ref={contentRef}
          className="base-page__content"
          data-page-content
          style={{
            top: PAGE_PADDING,
            left: PAGE_PADDING,
            right: PAGE_PADDING,
            bottom: showFooter ? `calc(${PAGE_PADDING} + ${FOOTER_HEIGHT})` : PAGE_PADDING,
          }}
        >
          {children}
        </div>
      )}

      {showFooter ? (
        <div
          className="base-page__footer"
          style={{
            left: PAGE_PADDING,
            right: PAGE_PADDING,
            bottom: PAGE_PADDING,
            height: FOOTER_HEIGHT,
          }}
        >
          <div className="base-page__footer-rule" />
          <div className="base-page__footer-row">
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
