import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Upload, Wrench, BarChart3, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — AI Tools Hub" }] }),
  component: AdminLayout,
});

const nav: ReadonlyArray<{ to: string; label: string; icon: any; exact?: boolean }> = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/import", label: "Bulk Import", icon: Upload },
  { to: "/admin/tools", label: "Tools", icon: Wrench },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/quality", label: "Data Quality", icon: ShieldAlert },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Admin
        </div>
        <nav className="flex flex-col gap-0.5">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to as any}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
