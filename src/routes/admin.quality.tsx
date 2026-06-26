import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { dataQualityScan } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/quality")({
  head: () => ({ meta: [{ title: "Data Quality — Admin" }] }),
  component: QualityPage,
});

function QualityPage() {
  const scan = useServerFn(dataQualityScan);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "quality"],
    queryFn: () => scan({ data: undefined as any }),
  });
  const refetch = useMutation({
    mutationFn: () => scan({ data: undefined as any }),
    onSuccess: (r) => qc.setQueryData(["admin", "quality"], r),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Data Quality</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tools with missing data or duplicate slugs/URLs.
          </p>
        </div>
        <Button onClick={() => refetch.mutate()} variant="outline">
          {refetch.isPending ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-1 h-4 w-4" />
          )}
          Rescan
        </Button>
      </header>

      {q.isLoading && <p className="text-muted-foreground">Scanning…</p>}
      {q.data && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Kpi label="Total tools" value={q.data.totalTools} />
            <Kpi label="With issues" value={q.data.issueCount} accent />
            <Kpi label="Clean" value={q.data.totalTools - q.data.issueCount} />
          </div>
        </div>
      )}

      {q.data && q.data.issues.length > 0 && (
        <div className="space-y-2">
          {q.data.issues.map((it) => (
            <div
              key={it.toolId}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"
            >
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <Link
                to="/tools/$slug"
                params={{ slug: it.slug }}
                className="font-medium hover:underline"
              >
                {it.name}
              </Link>
              <div className="ml-auto flex flex-wrap gap-1.5">
                {it.problems.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {q.data && q.data.issues.length === 0 && !q.isLoading && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Everything looks clean 🎉
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 font-display text-2xl font-bold tabular-nums ${accent ? "text-amber-700" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
