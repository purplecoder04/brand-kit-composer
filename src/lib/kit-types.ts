import type { BranchProfile } from "./branch-profile";

export type PageType =
  | "cover"
  | "divider"
  | "lesson"
  | "table"
  | "workbook"
  | "checklist"
  | "notes"
  | "back-cover"
  | "start-here"
  | "module-intro"
  | "quote"
  | "reflection"
  | "action-plan"
  | "resource"
  | "case-study"
  | "prompt-page"
  | "multi-prompt"
  | "progress-check"
  | "closing";

export type TableData = {
  headers: string[];
  rows: string[][];
};

export type LayoutAlignment = "default" | "left" | "center";
export type LayoutSize = "default" | "smaller" | "larger";
export type LayoutSpacing = "default" | "compact" | "normal" | "spacious";

export type LayoutOverrides = {
  titleOffset?: number;
  bodyOffset?: number;
  titleOffsetX?: number;
  bodyOffsetX?: number;
  titleAlign?: LayoutAlignment;
  bodyAlign?: LayoutAlignment;
  titleSize?: LayoutSize;
  bodySize?: LayoutSize;
  spacing?: LayoutSpacing;
};

export type Block = {
  id: string;
  pageType: PageType;
  order: number;
  title: string;
  subtitle?: string;
  body?: string;
  footerLabel?: string;
  prompt?: string;
  lines?: number;
  tableData?: TableData;
  /**
   * Optional cover keyword/pillar list. When present on a cover block,
   * CoverTemplate renders these in place of the default
   * "Structure / Legitimacy / Foundation" pillars. Additive — every other
   * template ignores this field.
   */
  keywords?: string[];
  layoutOverrides?: LayoutOverrides;
};

export type KitStatus = "Draft" | "Template Test" | "QC Needed" | "Sale Ready";
export type QCStatusValue = "Needs Review" | "In Review" | "Passed" | "Failed";
export type DocHubStatus = "Not Ready" | "Ready";

export type Kit = {
  id: string;
  name: string;
  branch: string;
  audience: string;
  tone: string;
  description: string;
  lessonGuide: string;
  workbook: string;
  tracker: string;
  branchProfile: BranchProfile;
  blocks: Block[];
  version: string;
  status: KitStatus;
  qcStatus: QCStatusValue;
  dochubStatus: DocHubStatus;
  updatedAt: string;
};

export type QCCheckValue = "pass" | "fail" | "na" | null;

export type QCCheck = {
  key: string;
  label: string;
  value: QCCheckValue;
  notes: string;
};

export type QCVerdict =
  | "STYLE-READY"
  | "NEEDS REPAIR"
  | "NOT READY FOR DOCHUB"
  | "SALE READY"
  | null;

export type QCReport = {
  kitId: string;
  checks: QCCheck[];
  readyForSale: boolean | null;
  readyForDochub: boolean | null;
  verdict: QCVerdict;
  updatedAt: string;
};

export type VersionEntry = {
  id: string;
  kitId: string;
  kitName: string;
  branch: string;
  version: string;
  exportDate: string;
  qcStatus: QCStatusValue;
  saleReady: boolean;
  dochubReady: boolean;
  notes: string;
};
