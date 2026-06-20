import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Upload, Wrench, FileText, BarChart3, ShieldAlert, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — AI Tools Hub" }] }),
  component: AdminLayout,
});

const nav: ReadonlyArray<{ to: string; label: string; icon: any; exact?: boolean }> = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/import", label: "Bulk Import", icon: Upload },
  { to: "/admin/tools", label: "Tools", icon: Wrench },
  { to: "/admin/blog", label: "Blog", icon: FileText },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/quality", label: "Data Quality", icon: ShieldAlert },
];


function AdminLayout() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const roles = useQuery({
    enabled: !!user,
    queryKey: ["admin", "roles", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      return (data ?? []).map((r) => r.role);
    },
  });
  const allowed = roles.data?.includes("admin") || roles.data?.includes("editor");

  if (roles.isLoading) return <div className="mx-auto max-w-6xl px-4 py-16">Loading…</div>;
  if (!allowed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Admin access required</h1>
        <p className="mt-2 text-muted-foreground">
          Your account doesn't have admin or editor privileges. Ask the site owner to grant you a role in the database.
        </p>
        <Link to="/" className="mt-6 inline-flex items-center gap-1 text-primary"><ArrowLeft className="h-4 w-4" /> Back home</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin</div>
        <nav className="flex flex-col gap-0.5">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to as any}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-surface hover:text-foreground"
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
