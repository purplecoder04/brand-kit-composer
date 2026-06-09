import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { Block, Kit, PageType, QCReport, VersionEntry } from "./kit-types";
import { SAMPLE_KIT } from "./sample-kit";
import { BRAND_PROFILE } from "./branch-profile";
import { buildMapperKit, type MapperContent } from "./mapper-content";

type State = {
  kits: Kit[];
  versions: VersionEntry[];
  qcReports: Record<string, QCReport>;
};

type Action =
  | { type: "createKit"; kit: Kit }
  | { type: "updateKit"; kitId: string; patch: Partial<Kit> }
  | { type: "updateBlock"; kitId: string; blockId: string; patch: Partial<Block> }
  | { type: "addBlock"; kitId: string; block: Block }
  | { type: "removeBlock"; kitId: string; blockId: string }
  | { type: "saveVersion"; entry: VersionEntry }
  | { type: "saveQCReport"; report: QCReport }
  | { type: "upsertMapperKit"; kit: Kit };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "createKit":
      return { ...state, kits: [...state.kits, action.kit] };
    case "updateKit":
      return {
        ...state,
        kits: state.kits.map((k) =>
          k.id === action.kitId
            ? { ...k, ...action.patch, updatedAt: new Date().toISOString() }
            : k,
        ),
      };
    case "updateBlock":
      return {
        ...state,
        kits: state.kits.map((k) =>
          k.id === action.kitId
            ? {
                ...k,
                updatedAt: new Date().toISOString(),
                blocks: k.blocks
                  .map((b) => (b.id === action.blockId ? { ...b, ...action.patch } : b))
                  .sort((a, b) => a.order - b.order),
              }
            : k,
        ),
      };
    case "addBlock":
      return {
        ...state,
        kits: state.kits.map((k) =>
          k.id === action.kitId
            ? {
                ...k,
                updatedAt: new Date().toISOString(),
                blocks: [...k.blocks, action.block].sort((a, b) => a.order - b.order),
              }
            : k,
        ),
      };
    case "removeBlock":
      return {
        ...state,
        kits: state.kits.map((k) =>
          k.id === action.kitId
            ? {
                ...k,
                updatedAt: new Date().toISOString(),
                blocks: k.blocks.filter((b) => b.id !== action.blockId),
              }
            : k,
        ),
      };
    case "saveVersion":
      return { ...state, versions: [action.entry, ...state.versions] };
    case "saveQCReport":
      return {
        ...state,
        qcReports: { ...state.qcReports, [action.report.kitId]: action.report },
      };
    case "upsertMapperKit": {
      const exists = state.kits.some((k) => k.id === action.kit.id);
      return {
        ...state,
        kits: exists
          ? state.kits.map((k) => (k.id === action.kit.id ? action.kit : k))
          : [...state.kits, action.kit],
      };
    }
    default:
      return state;
  }
}

const initialState: State = {
  kits: [SAMPLE_KIT],
  versions: [],
  qcReports: {},
};

type StoreCtx = {
  state: State;
  createKit: (input: {
    name: string;
    branch: string;
    audience: string;
    tone: string;
    description: string;
    lessonGuide: string;
    workbook: string;
    tracker: string;
  }) => string;
  updateKit: (kitId: string, patch: Partial<Kit>) => void;
  updateBlock: (kitId: string, blockId: string, patch: Partial<Block>) => void;
  addBlock: (kitId: string, pageType: PageType) => void;
  removeBlock: (kitId: string, blockId: string) => void;
  saveVersion: (kitId: string, notes: string) => void;
  saveQCReport: (report: QCReport) => void;
  upsertMapperKit: (content: MapperContent) => void;
};

const KitStoreContext = createContext<StoreCtx | null>(null);

function defaultTitleFor(pageType: PageType): string {
  switch (pageType) {
    case "cover":
      return "Cover Title";
    case "divider":
      return "New Section";
    case "lesson":
      return "New Lesson";
    case "table":
      return "New Table";
    case "workbook":
      return "Workbook Prompt";
    case "checklist":
      return "New Checklist";
    case "notes":
      return "Notes";
  }
}

export function KitStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const createKit = useCallback<StoreCtx["createKit"]>((input) => {
    const id = `kit-${Date.now()}`;
    const kit: Kit = {
      id,
      name: input.name || "Untitled Kit",
      branch: input.branch || "Brand",
      audience: input.audience,
      tone: input.tone,
      description: input.description,
      lessonGuide: input.lessonGuide,
      workbook: input.workbook,
      tracker: input.tracker,
      branchProfile: BRAND_PROFILE,
      blocks: [
        {
          id: `${id}-b1`,
          pageType: "cover",
          order: 1,
          title: input.name || "Untitled Kit",
          subtitle: "A Best Collective Brand Kit",
        },
      ],
      version: "v1",
      status: "Draft",
      qcStatus: "Needs Review",
      dochubStatus: "Not Ready",
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: "createKit", kit });
    return id;
  }, []);

  const upsertMapperKit = useCallback<StoreCtx["upsertMapperKit"]>((content) => {
    dispatch({ type: "upsertMapperKit", kit: buildMapperKit(content) });
  }, []);

  const value = useMemo<StoreCtx>(
    () => ({
      state,
      createKit,
      updateKit: (kitId, patch) => dispatch({ type: "updateKit", kitId, patch }),
      updateBlock: (kitId, blockId, patch) =>
        dispatch({ type: "updateBlock", kitId, blockId, patch }),
      addBlock: (kitId, pageType) => {
        const kit = state.kits.find((k) => k.id === kitId);
        const order = kit ? kit.blocks.length + 1 : 1;
        dispatch({
          type: "addBlock",
          kitId,
          block: {
            id: `b-${Date.now()}`,
            pageType,
            order,
            title: defaultTitleFor(pageType),
            subtitle: "",
            body: pageType === "lesson" ? "Write the lesson body here." : "",
            prompt: pageType === "workbook" ? "Write your prompt here." : undefined,
            lines: pageType === "workbook" ? 12 : undefined,
            tableData:
              pageType === "table"
                ? {
                    headers: ["Column A", "Column B", "Column C"],
                    rows: [
                      ["", "", ""],
                      ["", "", ""],
                      ["", "", ""],
                    ],
                  }
                : undefined,
          },
        });
      },
      removeBlock: (kitId, blockId) => dispatch({ type: "removeBlock", kitId, blockId }),
      saveVersion: (kitId, notes) => {
        const kit = state.kits.find((k) => k.id === kitId);
        if (!kit) return;
        const entry: VersionEntry = {
          id: `v-${Date.now()}`,
          kitId: kit.id,
          kitName: kit.name,
          branch: kit.branch,
          version: kit.version,
          exportDate: new Date().toISOString(),
          qcStatus: kit.qcStatus,
          saleReady: kit.status === "Sale Ready",
          dochubReady: kit.dochubStatus === "Ready",
          notes,
        };
        dispatch({ type: "saveVersion", entry });
      },
      saveQCReport: (report) => dispatch({ type: "saveQCReport", report }),
      upsertMapperKit,
    }),
    [state, createKit, upsertMapperKit],
  );

  return <KitStoreContext.Provider value={value}>{children}</KitStoreContext.Provider>;
}

export function useKitStore() {
  const ctx = useContext(KitStoreContext);
  if (!ctx) throw new Error("useKitStore must be used inside KitStoreProvider");
  return ctx;
}
