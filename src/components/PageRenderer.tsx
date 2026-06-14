import type { BranchProfile } from "@/lib/branch-profile";
import type { Block } from "@/lib/kit-types";
import { CoverTemplate } from "./templates/CoverTemplate";
import { SectionDividerTemplate } from "./templates/SectionDividerTemplate";
import { LessonTemplate } from "./templates/LessonTemplate";
import { TableTemplate } from "./templates/TableTemplate";
import { WorkbookTemplate } from "./templates/WorkbookTemplate";
import { ChecklistTemplate } from "./templates/ChecklistTemplate";
import { BackCoverTemplate } from "./templates/BackCoverTemplate";
import { StructuredPageTemplate } from "./templates/StructuredPageTemplate";

type Props = {
  block: Block;
  branchProfile: BranchProfile;
  pageNumber?: number;
  totalPages?: number;
};

export function PageRenderer(props: Props) {
  switch (props.block.pageType) {
    case "cover":
      return <CoverTemplate {...props} />;
    case "divider":
      return <SectionDividerTemplate {...props} />;
    case "lesson":
      return <LessonTemplate {...props} />;
    case "table":
      return <TableTemplate {...props} />;
    case "workbook":
      return <WorkbookTemplate {...props} />;
    case "checklist":
      return <ChecklistTemplate {...props} />;
    case "notes":
      return <WorkbookTemplate {...props} />;
    case "back-cover":
      return <BackCoverTemplate {...props} />;
    case "start-here":
    case "module-intro":
    case "quote":
    case "reflection":
    case "action-plan":
    case "resource":
    case "case-study":
    case "prompt-page":
    case "progress-check":
    case "closing":
      return <StructuredPageTemplate {...props} />;
    default:
      return null;
  }
}
