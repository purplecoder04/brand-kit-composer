import type { ReactNode } from "react";

/**
 * Scales a full-size 8.5x11 PageCanvas down for on-screen preview while
 * reserving the correct visual footprint. The print route renders pages
 * without this wrapper so print output is full size.
 */
export function PagePreview({
  scale = 0.55,
  children,
}: {
  scale?: number;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        width: `calc(8.5in * ${scale})`,
        height: `calc(11in * ${scale})`,
        position: "relative",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: "8.5in",
          height: "11in",
        }}
      >
        {children}
      </div>
    </div>
  );
}