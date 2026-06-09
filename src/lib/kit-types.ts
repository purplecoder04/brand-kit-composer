import type { BranchProfile } from "./branch-profile";

export type PageType = "cover" | "divider" | "lesson" | "table" | "workbook";

export type TableData = {
  headers: string[];
  rows: string[][];
};

export type Block = {
  id: string;
  pageType: PageType;
  order: number;
  title: string;
  subtitle?: string;
  body?: string;
  prompt?: string;
  lines?: number;
  tableData?: TableData;
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