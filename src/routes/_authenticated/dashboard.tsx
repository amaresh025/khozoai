import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, FilePlus, User, Mail, Shield, Camera } from "lucide-react";
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
  const [editing, setEditing] = useState(false);

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
    onSuccess: () => { toast.success("Profile updated"); qc.invalidateQueries({ queryKey: ["profile"] }); setEditing(false); },
    onError: (e) => toast.error((e as Error).message),
  });

  const isAdmin = roles.data?.includes("admin") || roles.data?.includes("editor");
  const p = profile.data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Profile header */}
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative">
              {p?.avatar_url ? (
                <img src={p.avatar_url} alt="" className="h-20 w-20 rounded-2xl border border-border object-cover" />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-brand text-white text-2xl font-display font-bold">
                  {(p?.display_name || user?.email || "?")[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">
                {p?.display_name || user?.email?.split("@")[0] || "Welcome"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {user?.email}</p>
              {p?.bio && <p className="mt-2 max-w-md text-sm text-muted-foreground">{p.bio}</p>}
              {roles.data && roles.data.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {roles.data.map((r) => (
                    <span key={r} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <Shield className="h-3 w-3" /> {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => setEditing((v) => !v)}>{editing ? "Cancel" : "Edit profile"}</Button>
            {isAdmin && <Link to="/admin"><Button variant="outline">Admin</Button></Link>}
            <Button variant="ghost" onClick={() => signOut()}>Sign out</Button>
          </div>
        </div>

        {editing && (
          <form
            className="mt-6 grid gap-3 border-t border-border pt-6 md:grid-cols-2"
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
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Display name</span>
              <input name="display_name" defaultValue={p?.display_name ?? ""} maxLength={120}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground"><Camera className="inline h-3 w-3 mr-1" /> Avatar URL</span>
              <input name="avatar_url" defaultValue={p?.avatar_url ?? ""} maxLength={500}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Bio</span>
              <textarea name="bio" rows={3} defaultValue={p?.bio ?? ""} maxLength={300}
                className="w-full rounded-md border border-border bg-background p-3 text-sm" />
            </label>
            <div className="md:col-span-2"><Button type="submit" disabled={updateProfile.isPending}>{updateProfile.isPending ? "Saving…" : "Save changes"}</Button></div>
          </form>
        )}
      </div>

      {/* Stat tiles */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Saved tools" value={favorites.data?.length ?? 0} icon={<Heart className="h-4 w-4" />} />
        <Stat label="Reviews written" value={reviewsQ.data?.length ?? 0} icon={<User className="h-4 w-4" />} />
        <Stat label="Submissions" value={submissions.data?.length ?? 0} icon={<FilePlus className="h-4 w-4" />} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><Heart className="h-5 w-5 text-rose-500" /> Saved tools</h2>
        {favorites.data && favorites.data.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.data.map((t: { id: string }) => <ToolCard key={t.id} tool={t as never} />)}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No saved tools yet. Browse <Link to="/tools" className="text-primary">tools</Link>.</p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><FilePlus className="h-5 w-5 text-primary" /> Your submissions</h2>
        {submissions.data && submissions.data.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-4 py-2 text-left">Tool</th><th className="px-4 py-2 text-left">Status</th><th className="px-4 py-2 text-left">Submitted</th></tr>
              </thead>
              <tbody>
                {submissions.data.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">{s.name}</td>
                    <td className="px-4 py-2 capitalize"><span className={`rounded-md px-2 py-0.5 text-xs ${s.status === "approved" ? "bg-emerald-500/10 text-emerald-600" : s.status === "rejected" ? "bg-rose-500/10 text-rose-600" : "bg-amber-500/10 text-amber-600"}`}>{s.status}</span></td>
                    <td className="px-4 py-2 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No submissions yet. <Link to="/submit" className="text-primary">Submit a tool</Link>.</p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-bold mb-4">Your reviews</h2>
        {reviewsQ.data && reviewsQ.data.length > 0 ? (
          <div className="space-y-3">
            {reviewsQ.data.map((r: { id: string; rating: number; title: string | null; body: string | null; tool: { name: string; slug: string } | null }) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <Link to="/tools/$slug" params={{ slug: r.tool?.slug ?? "" }} className="font-semibold text-primary hover:underline">{r.tool?.name}</Link>
                  <span className="text-amber-500 text-sm">{"★".repeat(r.rating)}</span>
                </div>
                {r.title && <div className="mt-1 font-medium">{r.title}</div>}
                {r.body && <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">You haven't reviewed any tools yet.</p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">{icon} {label}</div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}
