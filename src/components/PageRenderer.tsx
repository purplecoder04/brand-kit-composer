import type { BranchProfile } from "@/lib/branch-profile";
import type { Block } from "@/lib/kit-types";
import { CoverTemplate } from "./templates/CoverTemplate";
import { SectionDividerTemplate } from "./templates/SectionDividerTemplate";
import { LessonTemplate } from "./templates/LessonTemplate";
import { TableTemplate } from "./templates/TableTemplate";
import { WorkbookTemplate } from "./templates/WorkbookTemplate";
import { ChecklistTemplate } from "./templates/ChecklistTemplate";

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
    default:
      return null;
  }
}
