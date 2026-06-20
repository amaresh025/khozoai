import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Menu, X, LogIn, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const nav = [
    { to: "/tools", label: "Tools" },
    { to: "/categories", label: "Categories" },
    { to: "/compare", label: "Compare" },
    { to: "/prompts", label: "Prompts" },
    { to: "/blog", label: "Blog" },
  ] as const;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    navigate({ to: "/search", search: { q: query.trim() } });
    setOpen(false);
  }

  function handleSubmitClick(e: React.MouseEvent) {
    if (!user) {
      e.preventDefault();
      navigate({ to: "/auth", search: { redirect: "/submit" } });
    }
  }

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-white font-display font-bold text-base shadow-brand">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="font-display text-[18px] font-bold tracking-tight">
            Khoz<span className="text-gradient">oai</span>
          </span>
        </Link>

        <nav className="ml-4 hidden md:flex items-center">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm font-medium text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={onSubmit} className="relative ml-auto hidden flex-1 max-w-xs md:flex">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools…"
            className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm shadow-xs transition-colors focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/15"
          />
        </form>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Link to="/submit" onClick={handleSubmitClick}>
            <Button variant="ghost" size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Submit
            </Button>
          </Link>
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={() => signOut()}>Sign out</Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="gap-1">
                  <LogIn className="h-4 w-4" /> Sign in
                </Button>
              </Link>
              <Link to="/auth" search={{ tab: "signup" }}>
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="ml-auto p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-border bg-background px-4 py-4 md:hidden">
          <form onSubmit={onSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search AI tools…"
              className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm"
            />
          </form>
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="block rounded-md px-2 py-2 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              {n.label}
            </Link>
          ))}
          <div className="flex items-center justify-between pt-2">
            <ThemeToggle />
            {user ? (
              <Link to="/dashboard" onClick={() => setOpen(false)}>
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <div className="flex gap-2">
                <Link to="/auth" onClick={() => setOpen(false)}>
                  <Button variant="outline" size="sm">Sign in</Button>
                </Link>
                <Link to="/auth" search={{ tab: "signup" }} onClick={() => setOpen(false)}>
                  <Button size="sm">Get started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
