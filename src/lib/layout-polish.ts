import type { CSSProperties } from "react";
import type {
  Block,
  LayoutAlignment,
  LayoutOverrides,
  LayoutSize,
  LayoutSpacing,
} from "./kit-types";

const OFFSET_STEP_IN = 0.08;
const SIZE_DELTA_PX = 2;

export function hasLayoutOverrides(block: { layoutOverrides?: LayoutOverrides }): boolean {
  return Boolean(block.layoutOverrides && Object.keys(block.layoutOverrides).length > 0);
}

export function titleOffsetStyle(block: Block): CSSProperties {
  return offsetStyle(block.layoutOverrides?.titleOffsetX, block.layoutOverrides?.titleOffset);
}

export function bodyOffsetStyle(block: Block): CSSProperties {
  return offsetStyle(block.layoutOverrides?.bodyOffsetX, block.layoutOverrides?.bodyOffset);
}

export function titleTextStyle(
  block: Block,
  baseFontSizePx: number,
  defaultAlign: "left" | "center" = "left",
): CSSProperties {
  return {
    fontSize: `${adjustFontSize(baseFontSizePx, block.layoutOverrides?.titleSize)}px`,
    textAlign: resolveAlign(block.layoutOverrides?.titleAlign, defaultAlign),
  };
}

export function bodyTextStyle(
  block: Block,
  baseFontSizePx: number,
  defaultAlign: "left" | "center" = "left",
): CSSProperties {
  return {
    fontSize: `${adjustFontSize(baseFontSizePx, block.layoutOverrides?.bodySize)}px`,
    textAlign: resolveAlign(block.layoutOverrides?.bodyAlign, defaultAlign),
  };
}

export function sparkleAlign(
  block: Block,
  defaultAlign: "left" | "center" = "left",
): "left" | "center" {
  return resolveAlign(block.layoutOverrides?.titleAlign, defaultAlign);
}

export function spacingValues(block: Block): {
  lineHeight: number;
  paragraphMargin: string;
  panelPadding: string;
  itemPadding: string;
  writingLineHeight: string;
} {
  switch (block.layoutOverrides?.spacing) {
    case "compact":
      return {
        lineHeight: 1.48,
        paragraphMargin: "0 0 0.12in",
        panelPadding: "0.1in 0.24in",
        itemPadding: "0.04in 0",
        writingLineHeight: "0.34in",
      };
    case "spacious":
      return {
        lineHeight: 1.82,
        paragraphMargin: "0 0 0.3in",
        panelPadding: "0.22in 0.34in",
        itemPadding: "0.09in 0",
        writingLineHeight: "0.43in",
      };
    case "normal":
    case "default":
    default:
      return {
        lineHeight: 1.68,
        paragraphMargin: "0 0 0.2in",
        panelPadding: "0.16in 0.28in",
        itemPadding: "0.06in 0",
        writingLineHeight: "0.38in",
      };
  }
}

export function patchLayoutOverrides(
  current: LayoutOverrides | undefined,
  patch: Partial<LayoutOverrides>,
): LayoutOverrides | undefined {
  const next = { ...(current ?? {}), ...patch };
  for (const key of Object.keys(next) as Array<keyof LayoutOverrides>) {
    if (next[key] === undefined || next[key] === "default") {
      delete next[key];
    }
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

function offsetStyle(xValue?: number, yValue?: number): CSSProperties {
  if (!xValue && !yValue) return {};
  return {
    transform: `translate(${(xValue ?? 0) * OFFSET_STEP_IN}in, ${(yValue ?? 0) * OFFSET_STEP_IN}in)`,
  };
}

function adjustFontSize(base: number, size?: LayoutSize): number {
  if (size === "smaller") return base - SIZE_DELTA_PX;
  if (size === "larger") return base + SIZE_DELTA_PX;
  return base;
}

function resolveAlign(
  align: LayoutAlignment | undefined,
  defaultAlign: "left" | "center",
): "left" | "center" {
  if (align === "left" || align === "center") return align;
  return defaultAlign;
}
