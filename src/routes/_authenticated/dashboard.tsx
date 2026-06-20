import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, FilePlus, User, Mail, Shield, Camera, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Your Dashboard — Khozoai" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"saved" | "submissions" | "reviews" | "settings">("saved");

  const profile = useQuery({
    enabled: !!user,
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const favorites = useQuery({
    enabled: !!user,
    queryKey: ["dashboard", "favorites", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("tool:tools(*, category:categories(*))")
        .eq("user_id", user!.id);
      return (data ?? []).map((r: { tool: unknown }) => r.tool).filter(Boolean) as never[];
    },
  });

  const submissions = useQuery({
    enabled: !!user,
    queryKey: ["dashboard", "submissions", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("submissions").select("*")
        .eq("submitter_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const reviewsQ = useQuery({
    enabled: !!user,
    queryKey: ["dashboard", "reviews", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("reviews")
        .select("*, tool:tools(name, slug)")
        .eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const roles = useQuery({
    enabled: !!user,
    queryKey: ["dashboard", "roles", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      return (data ?? []).map((r) => r.role);
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (vars: { display_name: string; bio: string; avatar_url: string }) => {
      const { error } = await supabase.from("profiles").update(vars).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const isAdmin = roles.data?.includes("admin") || roles.data?.includes("editor");
  const p = profile.data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar Profile Card */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center text-center shadow-xs">
            {/* Avatar */}
            <div className="relative">
              {p?.avatar_url ? (
                <img src={p.avatar_url} alt="" className="h-24 w-24 rounded-2xl border border-border object-cover" />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-2xl bg-gradient-brand text-white text-3xl font-display font-bold mx-auto">
                  {(p?.display_name || user?.email || "?")[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Display Name & Email */}
            <h2 className="mt-4 font-display text-lg font-bold truncate max-w-full text-foreground">
              {p?.display_name || user?.email?.split("@")[0] || "Welcome"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1 truncate max-w-full">
              <Mail className="h-3.5 w-3.5 shrink-0" /> {user?.email}
            </p>
            {p?.bio && <p className="mt-3 text-xs text-muted-foreground line-clamp-3 leading-relaxed">{p.bio}</p>}

            {/* Roles badges */}
            {roles.data && roles.data.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-1">
                {roles.data.map((r) => (
                  <span key={r} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    <Shield className="h-2.5 w-2.5" /> {r}
                  </span>
                ))}
              </div>
            )}

            {/* Tab Navigation Menu */}
            <div className="w-full mt-6 flex flex-col gap-1 border-t border-border pt-4">
              <TabButton active={activeTab === "saved"} onClick={() => setActiveTab("saved")} icon={<Heart className="h-4 w-4" />}>
                Saved tools ({favorites.data?.length ?? 0})
              </TabButton>
              <TabButton active={activeTab === "submissions"} onClick={() => setActiveTab("submissions")} icon={<FilePlus className="h-4 w-4" />}>
                Submissions ({submissions.data?.length ?? 0})
              </TabButton>
              <TabButton active={activeTab === "reviews"} onClick={() => setActiveTab("reviews")} icon={<User className="h-4 w-4" />}>
                My reviews ({reviewsQ.data?.length ?? 0})
              </TabButton>
              <TabButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={<Camera className="h-4 w-4" />}>
                Account settings
              </TabButton>
            </div>

            {/* Footer Admin & Sign out */}
            <div className="w-full border-t border-border mt-6 pt-4 flex flex-col gap-2">
              {isAdmin && (
                <Link to="/admin" className="w-full">
                  <Button variant="outline" size="sm" className="w-full">Admin panel</Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-destructive flex items-center justify-center gap-1.5" onClick={() => signOut()}>
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Workspace Panels */}
        <main className="min-w-0">
          {activeTab === "saved" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-500 fill-rose-500" /> Saved Tools
                </h2>
                <span className="text-xs text-muted-foreground">{favorites.data?.length ?? 0} tools</span>
              </div>
              {favorites.data && favorites.data.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {favorites.data.map((t: any) => <ToolCard key={t.id} tool={t} />)}
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-border rounded-xl">
                  <p className="text-muted-foreground text-sm">No saved tools yet.</p>
                  <Link to="/tools" className="text-primary text-sm font-semibold hover:underline mt-2 inline-block">Browse tools →</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === "submissions" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                <h2 className="font-display text-xl font-bold flex items-center gap-2">
                  <FilePlus className="h-5 w-5 text-primary" /> Your Submissions
                </h2>
                <span className="text-xs text-muted-foreground">{submissions.data?.length ?? 0} submitted</span>
              </div>
              {submissions.data && submissions.data.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-border bg-background">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Tool</th>
                          <th className="px-4 py-3 text-left font-semibold">Status</th>
                          <th className="px-4 py-3 text-left font-semibold">Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.data.map((s) => (
                          <tr key={s.id} className="border-t border-border hover:bg-surface/40 transition-colors">
                            <td className="px-4 py-3 font-semibold text-foreground">{s.name}</td>
                            <td className="px-4 py-3 capitalize">
                              <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                                s.status === "approved" ? "bg-emerald-500/10 text-emerald-600" :
                                s.status === "rejected" ? "bg-rose-500/10 text-rose-600" :
                                "bg-amber-500/10 text-amber-600"
                              }`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-border rounded-xl">
                  <p className="text-muted-foreground text-sm">No submissions yet.</p>
                  <Link to="/submit" className="text-primary text-sm font-semibold hover:underline mt-2 inline-block">Submit a tool →</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                <h2 className="font-display text-xl font-bold">Your Reviews</h2>
                <span className="text-xs text-muted-foreground">{reviewsQ.data?.length ?? 0} reviews</span>
              </div>
              {reviewsQ.data && reviewsQ.data.length > 0 ? (
                <div className="space-y-4">
                  {reviewsQ.data.map((r: any) => (
                    <div key={r.id} className="rounded-xl border border-border bg-background p-5 hover:border-primary/20 transition-all">
                      <div className="flex items-center justify-between">
                        <Link to="/tools/$slug" params={{ slug: r.tool?.slug ?? "" }} className="font-semibold text-primary hover:underline">{r.tool?.name}</Link>
                        <span className="text-amber-500 text-sm">{"★".repeat(r.rating)}</span>
                      </div>
                      {r.title && <div className="mt-2 font-semibold text-sm text-foreground">{r.title}</div>}
                      {r.body && <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{r.body}</p>}
                      <div className="mt-3 text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-border rounded-xl">
                  <p className="text-muted-foreground text-sm">You haven't reviewed any tools yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="mb-6 border-b border-border pb-4">
                <h2 className="font-display text-xl font-bold">Account Settings</h2>
                <p className="text-xs text-muted-foreground mt-1">Manage your public profile details and bio.</p>
              </div>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  updateProfile.mutate({
                    display_name: String(fd.get("display_name") || ""),
                    bio: String(fd.get("bio") || ""),
                    avatar_url: String(fd.get("avatar_url") || ""),
                  });
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-muted-foreground">Display Name</span>
                    <input name="display_name" defaultValue={p?.display_name ?? ""} maxLength={120}
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-muted-foreground">Avatar URL</span>
                    <input name="avatar_url" defaultValue={p?.avatar_url ?? ""} maxLength={500}
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-muted-foreground">Bio</span>
                  <textarea name="bio" rows={4} defaultValue={p?.bio ?? ""} maxLength={300}
                    className="w-full rounded-md border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </label>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? "Saving changes…" : "Save changes"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all w-full ${
        active
          ? "bg-primary text-primary-foreground shadow-xs"
          : "text-muted-foreground hover:bg-surface hover:text-foreground"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{children}</span>
    </button>
  );
}
