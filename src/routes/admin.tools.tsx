import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Star,
  Trash2,
  Pencil,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { ToolEditor } from "@/components/admin/ToolEditor";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListTools,
  adminToggleField,
  adminDeleteTool,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/tools")({
  head: () => ({ meta: [{ title: "Tools — Admin" }] }),
  component: AdminToolsPage,
});

function AdminToolsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | "new" | null>(null);

  const listToolsFn = useServerFn(adminListTools);
  const toggleFn = useServerFn(adminToggleField);
  const deleteFn = useServerFn(adminDeleteTool);

  const tools = useQuery({
    queryKey: ["admin", "tools-list", search],
    queryFn: async () => {
      const result = await listToolsFn({ data: { search } });
      return result ?? [];
    },
  });

  const toggle = useMutation({
    mutationFn: async (vars: {
      id: string;
      field: "featured" | "free_plan" | "api_available" | "browser_extension" | "mobile_app" | "is_published";
      value: boolean;
    }) => {
      await toggleFn({ data: vars });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["tools"] });
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      await deleteFn({ data: { id } });
    },
    onSuccess: () => {
      toast.success("Deleted successfully");
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["tools"] });
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Tools</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, edit, and feature tools using the unified database schema.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setEditing("new")}>
            <Plus className="mr-1 h-4 w-4" /> New tool
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-left font-semibold">Pricing</th>
                <th className="px-4 py-3 text-left font-semibold">Capabilities</th>
                <th className="px-4 py-3 text-center font-semibold">Featured</th>
                <th className="px-4 py-3 text-center font-semibold">Published</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tools.data?.map((t: any) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {t.logo_url && (
                        <img
                          src={t.logo_url}
                          alt=""
                          className="h-6 w-6 rounded border border-border object-contain bg-background"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="truncate font-medium">{t.tool_name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.category}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{t.pricing}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {t.capabilities && t.capabilities.length > 0 ? (
                        t.capabilities.slice(0, 3).map((cap: string) => (
                          <span
                            key={cap}
                            className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary border border-primary/10"
                          >
                            {cap}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                      {t.capabilities && t.capabilities.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{t.capabilities.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <FlagBtn
                      active={t.featured}
                      onClick={() =>
                        toggle.mutate({ id: t.id, field: "featured", value: !t.featured })
                      }
                      title="Featured"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </FlagBtn>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <FlagBtn
                      active={t.is_published !== false}
                      onClick={() =>
                        toggle.mutate({ id: t.id, field: "is_published", value: !t.is_published })
                      }
                      title="Published"
                    >
                      <span className="text-[10px] font-bold uppercase">{t.is_published !== false ? "Yes" : "No"}</span>
                    </FlagBtn>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        to="/tools/$slug"
                        params={{ slug: t.slug }}
                        target="_blank"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface text-muted-foreground hover:text-foreground"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setEditing(t.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface text-muted-foreground hover:text-foreground"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${t.tool_name}"?`)) del.mutate(t.id);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {tools.data?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No tools found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <ToolEditor
          toolId={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["admin"] });
            qc.invalidateQueries({ queryKey: ["tools"] });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function FlagBtn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-surface"
      }`}
    >
      {children}
    </button>
  );
}
