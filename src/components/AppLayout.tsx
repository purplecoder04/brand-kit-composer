import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import {
  LayoutDashboard,
  FilePlus2,
  LayoutTemplate,
  Wrench,
  Printer,
  ClipboardCheck,
  Library,
  Edit3,
  Upload,
  PackageCheck,
  BookOpenText,
  FileText,
  MousePointer2,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/create", label: "Create Kit", icon: FilePlus2 },
  { to: "/mapper", label: "Kit Content Mapper", icon: Edit3 },
  { to: "/import", label: "Paste Importer", icon: Upload },
  { to: "/templates", label: "Branch Templates", icon: LayoutTemplate },
  { to: "/builder", label: "Multi-Page Builder", icon: Wrench },
  { to: "/print-preview", label: "Print Preview", icon: Printer },
  { to: "/qc", label: "QC Report", icon: ClipboardCheck },
  { to: "/version-library", label: "Version Library", icon: Library },
  { to: "/package-export", label: "Package Export", icon: PackageCheck },
  { to: "/lesson-guide", label: "Lesson Guide", icon: BookOpenText },
  { to: "/how-to-kit", label: "How-To PDF", icon: FileText },
  { to: "/fillable-fields", label: "Fillable Fields", icon: MousePointer2 },
] as const;

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="app-chrome min-h-screen" style={{ background: "#F4EFE6", color: "#222026" }}>
      <div className="flex min-h-screen">
        <aside
          className="w-64 shrink-0 border-r"
          style={{ borderColor: "#D8CEC2", background: "#FAF6F0" }}
        >
          <div className="px-6 pt-7 pb-8">
            <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#4F2D68" }}>
              Best Collective
            </div>
            <div
              className="mt-1 text-xl"
              style={{
                fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
                color: "#4F2D68",
              }}
            >
              Kit Factory <span style={{ opacity: 0.5 }}>v1</span>
            </div>
          </div>
          <nav className="px-3 space-y-1">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = pathname === to || pathname.startsWith(to + "/");
              return (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
                  style={
                    active ? { background: "#4F2D68", color: "#ffffff" } : { color: "#222026" }
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}
