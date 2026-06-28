import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import {
  LayoutDashboard,
  LayoutTemplate,
  Wrench,
  ClipboardCheck,
  Library,
  Upload,
  PackageCheck,
  MousePointer2,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Production",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/import", label: "Import Content", icon: Upload },
      { to: "/builder", label: "Builder", icon: Wrench },
      { to: "/version-library", label: "Version Library", icon: Library },
      { to: "/qc", label: "QC", icon: ClipboardCheck },
      { to: "/fillable-fields", label: "Fillable Fields", icon: MousePointer2 },
      { to: "/package-export", label: "Package", icon: PackageCheck },
    ],
  },
  {
    label: "Setup",
    items: [{ to: "/templates", label: "Branch Templates", icon: LayoutTemplate }],
  },
] as const;

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="app-chrome min-h-screen" style={{ background: "#F4EFE6", color: "#222026" }}>
      <div className="flex min-h-screen">
        <aside
          className="w-60 shrink-0 border-r"
          style={{ borderColor: "#D8CEC2", background: "#FAF6F0" }}
        >
          <div className="px-5 pt-6 pb-7">
            <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#4F2D68" }}>
              Best Collective
            </div>
            <div
              className="mt-1 text-[1.35rem]"
              style={{
                fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
                color: "#4F2D68",
              }}
            >
              Kit Factory
            </div>
          </div>
          <nav className="space-y-5 px-3">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <div
                  className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "#8a7e8f" }}
                >
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.items.map(({ to, label, icon: Icon }) => {
                    const active = pathname === to || pathname.startsWith(to + "/");
                    return (
                      <Link
                        key={to}
                        to={to}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
                        style={
                          active
                            ? { background: "#4F2D68", color: "#ffffff" }
                            : { color: "#322c36" }
                        }
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
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
