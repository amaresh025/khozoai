import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    tab: s.tab === "signup" ? "signup" as const : undefined,
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in or Create Account — Khozoai" },
      { name: "description", content: "Sign in or create your free Khozoai account to save, review, and submit AI tools." },
      { property: "og:url", content: "/auth" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading: authLoading } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(search.tab === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate({ to: (search.redirect ?? "/dashboard") as "/dashboard" });
    }
  }, [user, authLoading, navigate, search.redirect]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          data: { full_name: name },
        },
      });
      if (error) toast.error(error.message);
      else toast.success("Account created!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else toast.success("Welcome back!");
    }
    setLoading(false);
  }

  async function onGoogle() {
    const provider = "google";
    console.log("OAuth Provider:", provider);

    if (!provider) {
      const err = new Error("OAuth Provider is undefined");
      console.error("[Google OAuth]", err);
      toast.error(err.message);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error("[Google OAuth] signInWithOAuth error:", {
          message: error.message,
          name: error.name,
          status: (error as any)?.status,
        });
        toast.error(error.message ?? "Google sign-in failed");
        return;
      }

      // Supabase usually redirects; keep this for completeness.
      if (data?.url) {
        console.log("[Google OAuth] authorize URL:", data.url);
        window.location.assign(data.url);
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error("[Google OAuth] Unexpected exception:", err);
      toast.error(err.message ?? "Google sign-in failed");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-center">
        <span className="inline-grid place-items-center h-12 w-12 rounded-2xl bg-gradient-brand shadow-sm">
          <Sparkles className="h-6 w-6 text-white" />
        </span>
        <h1 className="font-display text-3xl font-bold mt-4">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {mode === "signin" ? "Sign in to favorite tools, write reviews, and submit your own." : "Join Khozoai — discover the best AI tools."}
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6">
        <Button onClick={onGoogle} variant="outline" className="w-full mb-3">
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" /><path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.83z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z" /></svg>
          Continue with Google
        </Button>

        <div className="relative my-4 text-center text-xs text-muted-foreground">
          <span className="bg-card px-2 relative z-10">or continue with email</span>
          <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "signup" && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={120}
              className="w-full h-11 rounded-lg bg-secondary/60 border border-border px-3 text-sm" />
          )}
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" maxLength={255}
            className="w-full h-11 rounded-lg bg-secondary/60 border border-border px-3 text-sm" />
          <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8 chars)"
            className="w-full h-11 rounded-lg bg-secondary/60 border border-border px-3 text-sm" />
          <Button type="submit" disabled={loading} className="w-full bg-gradient-brand text-white border-0">
            {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary font-medium">
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
