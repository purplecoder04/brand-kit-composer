export type BranchProfile = {
  name: string;
  branchLabel: string;
  status: "Active" | "Inactive";
  templateStructure: string;
  colorProfilePlaceholder: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  stoneColor: string;
  textColor: string;
  goldAccent: string;
  footerLabel: string;
  blushColor: string;
  lilacColor: string;
};

export const BRAND_PROFILE: BranchProfile = {
  name: "Brand",
  branchLabel: "Best Collective Brand",
  status: "Active",
  templateStructure: "Brand V1",
  colorProfilePlaceholder: "Approved Brand V1 color profile",
  primaryColor: "#4F2D68",
  accentColor: "#9A7BB0",
  backgroundColor: "#FAF6F0",
  stoneColor: "#D8CEC2",
  textColor: "#222026",
  goldAccent: "#B89B5E",
  footerLabel: "Best Collective | Brand",
  blushColor: "#E8C8C0",
  lilacColor: "#C9B6D9",
};

function createBranchProfile(name: string, branchLabel: string): BranchProfile {
  return {
    ...BRAND_PROFILE,
    name,
    branchLabel,
    templateStructure: name === "Brand" ? "Brand V1" : "Brand V1 for now",
    colorProfilePlaceholder:
      name === "Brand" ? "Approved Brand V1 color profile" : "Brand V1 placeholder colors",
    footerLabel: `Best Collective | ${name}`,
  };
}

export const BRANCH_TEMPLATE_PROFILES: BranchProfile[] = [
  BRAND_PROFILE,
  createBranchProfile("Rise", "Best Collective Rise"),
  createBranchProfile("Land", "Best Collective Land"),
  createBranchProfile("Rebuild", "Best Collective Rebuild"),
];

export const BRANCH_PROFILES: Record<string, BranchProfile> = {
  ...Object.fromEntries(BRANCH_TEMPLATE_PROFILES.map((profile) => [profile.name, profile])),
};

export function resolveBranchProfile(branch: string | undefined | null): BranchProfile {
  if (!branch) return BRAND_PROFILE;
  return BRANCH_PROFILES[branch] ?? BRAND_PROFILE;
}
