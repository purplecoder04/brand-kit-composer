import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

const WORKFLOW_STEPS = [
  { label: "Import", to: "/import" as const },
  { label: "Builder", to: "/builder" as const },
  { label: "Export PDF", to: "/builder" as const },
  { label: "Fillable Fields", to: "/fillable-fields" as const },
  { label: "Package", to: "/package-export" as const },
];

export function WorkflowContext({ currentStep }: { currentStep: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-1 text-xs" style={{ color: "#6b6470" }}>
      {WORKFLOW_STEPS.map((step, index) => (
        <span key={step.label} className="flex items-center gap-1">
          {index > 0 ? <ChevronRight className="h-3 w-3 shrink-0" /> : null}
          {index + 1 === currentStep ? (
            <span className="font-semibold" style={{ color: "#4F2D68" }}>
              {step.label}
            </span>
          ) : (
            <Link to={step.to} className="hover:underline">
              {step.label}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
