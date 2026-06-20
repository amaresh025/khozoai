import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Menu, X, LogIn, Plus, Sparkles, LogOut, User } from "lucide-react";
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
        <div className="flex flex-col gap-4 border-t border-border bg-background px-4 py-4 md:hidden">
          {/* Search Bar */}
          <form onSubmit={onSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search AI tools…"
              className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </form>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Explore
            </div>
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="block rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                activeProps={{ className: "block rounded-md px-2 py-2 text-sm font-semibold text-foreground bg-accent/40" }}
                onClick={() => setOpen(false)}
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/submit"
              onClick={(e) => {
                handleSubmitClick(e);
                setOpen(false);
              }}
              className="flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Plus className="h-4 w-4" /> Submit a Tool
            </Link>
          </nav>

          <hr className="border-border my-1" />

          {/* Account / Auth Actions */}
          <div>
            {user ? (
              <div className="flex flex-col gap-1">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Account ({user.email?.split("@")[0]})
                </div>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  <User className="h-4 w-4" /> Dashboard & Profile
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link to="/auth" onClick={() => setOpen(false)} className="w-full">
                  <Button variant="outline" className="w-full justify-center gap-2">
                    <LogIn className="h-4 w-4" /> Sign in
                  </Button>
                </Link>
                <Link to="/auth" search={{ tab: "signup" }} onClick={() => setOpen(false)} className="w-full">
                  <Button className="w-full justify-center">
                    Get started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between border-t border-border pt-3 mt-1">
            <span className="text-sm font-medium text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
