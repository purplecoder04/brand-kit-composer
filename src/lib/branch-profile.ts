export type BranchProfile = {
  name: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  stoneColor: string;
  textColor: string;
  goldAccent: string;
  footerLabel: string;
};

export const BRAND_PROFILE: BranchProfile = {
  name: "Brand",
  primaryColor: "#4F2D68",
  accentColor: "#9A7BB0",
  backgroundColor: "#FAF6F0",
  stoneColor: "#D8CEC2",
  textColor: "#222026",
  goldAccent: "#B89B5E",
  footerLabel: "Best Collective | Brand",
};

export const BRANCH_PROFILES: Record<string, BranchProfile> = {
  Brand: BRAND_PROFILE,
};