import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/contact-messages")({
    head: () => ({ meta: [{ title: "Contact Messages — Admin" }] }),
    component: ContactMessagesAdminPage,
});

function ContactMessagesAdminPage() {
    const qc = useQueryClient();
    const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

    const { data: messages, isLoading, error } = useQuery({
        queryKey: ["admin", "contact-messages"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("contact_messages")
                .select("id,name,email,subject,message,read,created_at")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data ?? []) as any[];
        },
    });

    const markReadMut = useMutation({
        mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
            setLoadingActionId(id);
            const { error } = await (supabase as any)
                .from("contact_messages")
                .update({ read })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Updated");
            setLoadingActionId(null);
            qc.invalidateQueries({ queryKey: ["admin", "contact-messages"] });
        },
        onError: () => {
            setLoadingActionId(null);
            toast.error("Failed to update message");
        },
    });

    const delMut = useMutation({
        mutationFn: async (id: string) => {
            setLoadingActionId(id);
            const { error } = await (supabase as any)
                .from("contact_messages")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Deleted");
            setLoadingActionId(null);
            qc.invalidateQueries({ queryKey: ["admin", "contact-messages"] });
        },
        onError: () => {
            setLoadingActionId(null);
            toast.error("Failed to delete message");
        },
    });

    const rows = useMemo(() => messages ?? [], [messages]);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="font-display text-3xl font-bold tracking-tight">Contact Messages</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Messages submitted from the contact form.
                </p>
            </header>

            {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    Failed to load messages.
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-sm">
                        <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">Name</th>
                                <th className="px-4 py-3 text-left font-semibold">Email</th>
                                <th className="px-4 py-3 text-left font-semibold">Subject</th>
                                <th className="px-4 py-3 text-left font-semibold">Message</th>
                                <th className="px-4 py-3 text-left font-semibold">Date &amp; Time</th>
                                <th className="px-4 py-3 text-left font-semibold">Status</th>
                                <th className="px-4 py-3 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {isLoading && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                                        Loading…
                                    </td>
                                </tr>
                            )}

                            {!isLoading &&
                                rows.map((m) => (
                                    <tr key={m.id} className="border-t border-border">
                                        <td className="px-4 py-3">{m.name}</td>
                                        <td className="px-4 py-3">{m.email}</td>
                                        <td className="px-4 py-3 max-w-[260px] truncate">{m.subject}</td>
                                        <td className="px-4 py-3 max-w-[320px] whitespace-pre-wrap">{m.message}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {m.created_at ? new Date(m.created_at).toLocaleString() : "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {m.read ? (
                                                <Badge variant="secondary">Read</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10">
                                                    Unread
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={loadingActionId === m.id}
                                                    onClick={() => markReadMut.mutate({ id: m.id, read: !m.read })}
                                                >
                                                    {m.read ? "Mark unread" : "Mark read"}
                                                </Button>

                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    disabled={loadingActionId === m.id}
                                                    onClick={() => {
                                                        if (confirm("Delete this message?")) delMut.mutate(m.id);
                                                    }}
                                                    className="gap-2"
                                                >
                                                    <Trash2 className="h-4 w-4" /> Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                            {!isLoading && rows.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                        No contact messages.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
