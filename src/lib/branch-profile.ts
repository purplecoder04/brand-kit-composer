export type BranchProfile = {
  name: string;
  displayName: string;
  branchLabel: string;
  status: "Active" | "Inactive";
  templateStructure: string;
  colorProfilePlaceholder: string;
  coverImagePath: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  stoneColor: string;
  textColor: string;
  goldAccent: string;
  footerLabel: string;
  blushColor: string;
  lilacColor: string;
  blueAccent?: string;
  dominantShapeColor: string;
  secondaryShapeColor: string;
  softWashColor: string;
  lineAccentColor: string;
  smallMarkColor: string;
  footerBarColor: string;
  footerTextColor: string;
  tableHeaderColor: string;
  worksheetLineColor: string;
  decorativeOpacity: number;
  shapeWeight: "light-medium" | "low-medium" | "soft-medium" | "medium-soft" | "medium";
  mood: string;
  colorSwatches: Array<{
    label: string;
    color: string;
  }>;
};

export const BRAND_PROFILE: BranchProfile = {
  name: "Brand",
  displayName: "Brand",
  branchLabel: "Brand",
  status: "Active",
  templateStructure: "Brand V1",
  colorProfilePlaceholder: "Approved Brand color profile",
  coverImagePath: "/images/covers/brand-cover.png",
  primaryColor: "#4F2D68",
  accentColor: "#9A7BB0",
  backgroundColor: "#FAF6F0",
  stoneColor: "#D8CEC2",
  textColor: "#222026",
  goldAccent: "#C6A85B",
  footerLabel: "Best Collective | Brand",
  blushColor: "#F8EDE8",
  lilacColor: "#E3D9E9",
  dominantShapeColor: "#4F2D68",
  secondaryShapeColor: "#9A7BB0",
  softWashColor: "#E3D9E9",
  lineAccentColor: "#C6A85B",
  smallMarkColor: "#C6A85B",
  footerBarColor: "#4F2D68",
  footerTextColor: "#FAF6F0",
  tableHeaderColor: "#4F2D68",
  worksheetLineColor: "#D8CEC2",
  decorativeOpacity: 0.82,
  shapeWeight: "medium",
  mood: "Premium business, polished, strategic",
  colorSwatches: [
    { label: "Primary", color: "#4F2D68" },
    { label: "Accent", color: "#9A7BB0" },
    { label: "Background / Cream", color: "#FAF6F0" },
    { label: "Stone / Border", color: "#D8CEC2" },
    { label: "Text / Ink", color: "#222026" },
    { label: "Gold Accent", color: "#C6A85B" },
    { label: "Blush", color: "#F8EDE8" },
    { label: "Lilac", color: "#E3D9E9" },
  ],
};

export const BRANCH_TEMPLATE_PROFILES: BranchProfile[] = [
  BRAND_PROFILE,
  {
    name: "Rise",
    displayName: "Rise",
    branchLabel: "Rise",
    status: "Active",
    templateStructure: "Brand V1 for now",
    colorProfilePlaceholder: "Approved Rise color profile",
    coverImagePath: "/images/covers/rise-cover.png",
    primaryColor: "#8F5F7D",
    accentColor: "#B58FA8",
    backgroundColor: "#F8EDE8",
    stoneColor: "#DCCFC4",
    textColor: "#5B4A52",
    goldAccent: "#C6A85B",
    footerLabel: "Best Collective | Rise",
    blushColor: "#E7C2C7",
    lilacColor: "#E3D9E9",
    dominantShapeColor: "#8F5F7D",
    secondaryShapeColor: "#B58FA8",
    softWashColor: "#F8EDE8",
    lineAccentColor: "#C6A85B",
    smallMarkColor: "#B58FA8",
    footerBarColor: "#8F5F7D",
    footerTextColor: "#F8EDE8",
    tableHeaderColor: "#8F5F7D",
    worksheetLineColor: "#DCCFC4",
    decorativeOpacity: 0.7,
    shapeWeight: "soft-medium",
    mood: "Soft women's growth, reflective, warm",
    colorSwatches: [
      { label: "Primary", color: "#8F5F7D" },
      { label: "Accent", color: "#B58FA8" },
      { label: "Background / Cream", color: "#F8EDE8" },
      { label: "Stone / Sand", color: "#DCCFC4" },
      { label: "Text / Ink", color: "#5B4A52" },
      { label: "Gold Accent", color: "#C6A85B" },
      { label: "Blush", color: "#E7C2C7" },
      { label: "Lilac", color: "#E3D9E9" },
    ],
  },
  {
    name: "Land",
    displayName: "Land",
    branchLabel: "Land",
    status: "Active",
    templateStructure: "Brand V1 for now",
    colorProfilePlaceholder: "Approved Land color profile",
    coverImagePath: "/images/covers/land-cover.jpg",
    primaryColor: "#3F5147",
    accentColor: "#6F7F63",
    backgroundColor: "#F7F2EB",
    stoneColor: "#CFC6B8",
    textColor: "#2D332F",
    goldAccent: "#A88F68",
    footerLabel: "Best Collective | Land",
    blushColor: "#DCCFC4",
    lilacColor: "#B9C0B0",
    dominantShapeColor: "#3F5147",
    secondaryShapeColor: "#6F7F63",
    softWashColor: "#DCCFC4",
    lineAccentColor: "#A88F68",
    smallMarkColor: "#A88F68",
    footerBarColor: "#3F5147",
    footerTextColor: "#F7F2EB",
    tableHeaderColor: "#3F5147",
    worksheetLineColor: "#CFC6B8",
    decorativeOpacity: 0.62,
    shapeWeight: "low-medium",
    mood: "Grounded, earthy, mature, steady",
    colorSwatches: [
      { label: "Primary", color: "#3F5147" },
      { label: "Accent", color: "#6F7F63" },
      { label: "Background / Cream", color: "#F7F2EB" },
      { label: "Stone / Border", color: "#CFC6B8" },
      { label: "Text / Ink", color: "#2D332F" },
      { label: "Gold Accent", color: "#A88F68" },
      { label: "Blush", color: "#DCCFC4" },
      { label: "Lilac", color: "#B9C0B0" },
    ],
  },
  {
    name: "Rebuild",
    displayName: "Rebuild",
    branchLabel: "Rebuild",
    status: "Active",
    templateStructure: "Brand V1 for now",
    colorProfilePlaceholder: "Approved Rebuild color profile",
    coverImagePath: "/images/covers/rebuild-cover.jpg",
    primaryColor: "#8BA3B7",
    accentColor: "#6F7F63",
    backgroundColor: "#FAF6F0",
    stoneColor: "#DCC9B5",
    textColor: "#2A2A2E",
    goldAccent: "#DCC9B5",
    footerLabel: "Best Collective | Rebuild",
    blushColor: "#E7C2C7",
    lilacColor: "#E3D9E9",
    dominantShapeColor: "#8BA3B7",
    secondaryShapeColor: "#6F7F63",
    softWashColor: "#DCE8EE",
    lineAccentColor: "#6F7F63",
    smallMarkColor: "#6F7F63",
    footerBarColor: "#8BA3B7",
    footerTextColor: "#FAF6F0",
    tableHeaderColor: "#8BA3B7",
    worksheetLineColor: "#DCC9B5",
    decorativeOpacity: 0.55,
    shapeWeight: "light-medium",
    mood: "Fresh start, hopeful, clean, airy",
    colorSwatches: [
      { label: "Primary / Soft Blue", color: "#8BA3B7" },
      { label: "Accent / Sage Green", color: "#6F7F63" },
      { label: "Background / Soft Cream", color: "#FAF6F0" },
      { label: "Stone / Warm Tan", color: "#DCC9B5" },
      { label: "Text / Ink Charcoal", color: "#2A2A2E" },
      { label: "Gold Accent", color: "#DCC9B5" },
      { label: "Blush / Soft Rose", color: "#E7C2C7" },
      { label: "Lilac / Light Plum", color: "#E3D9E9" },
    ],
  },
  {
    name: "Heal",
    displayName: "Meet at the Heal",
    branchLabel: "Heal",
    status: "Active",
    templateStructure: "Brand V1 for now",
    colorProfilePlaceholder: "Approved Heal color profile",
    coverImagePath: "/images/covers/meet-at-the-heal-cover.png",
    primaryColor: "#8F5F7D",
    accentColor: "#6F7F63",
    backgroundColor: "#FAF6F0",
    stoneColor: "#E3D9E9",
    textColor: "#2A2A2E",
    goldAccent: "#C68167",
    footerLabel: "Best Collective | Heal",
    blushColor: "#F8EDE8",
    lilacColor: "#E3D9E9",
    blueAccent: "#8BA3B7",
    dominantShapeColor: "#8F5F7D",
    secondaryShapeColor: "#6F7F63",
    softWashColor: "#F8EDE8",
    lineAccentColor: "#C68167",
    smallMarkColor: "#8BA3B7",
    footerBarColor: "#8F5F7D",
    footerTextColor: "#FAF6F0",
    tableHeaderColor: "#8F5F7D",
    worksheetLineColor: "#E3D9E9",
    decorativeOpacity: 0.68,
    shapeWeight: "medium-soft",
    mood: "Warm healing, emotionally grounded, premium sanctuary",
    colorSwatches: [
      { label: "Primary / Rose", color: "#8F5F7D" },
      { label: "Accent / Sage", color: "#6F7F63" },
      { label: "Background / Cream", color: "#FAF6F0" },
      { label: "Stone / Plum", color: "#E3D9E9" },
      { label: "Text / Charcoal", color: "#2A2A2E" },
      { label: "Gold Accent", color: "#C68167" },
      { label: "Blush", color: "#F8EDE8" },
      { label: "Lilac / Plum", color: "#E3D9E9" },
      { label: "Blue Accent", color: "#8BA3B7" },
    ],
  },
];

export const BRANCH_PROFILES: Record<string, BranchProfile> = {
  ...Object.fromEntries(BRANCH_TEMPLATE_PROFILES.map((profile) => [profile.name, profile])),
};

export function resolveBranchProfile(branch: string | undefined | null): BranchProfile {
  if (!branch) return BRAND_PROFILE;
  return BRANCH_PROFILES[branch] ?? BRAND_PROFILE;
}
