import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand text-white text-xs font-bold">
              ✦
            </span>
            <span className="font-display text-base font-semibold tracking-tight">Khozoai</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Khozoai — the curated directory of the best AI tools. Discover, compare, and review
            tools across every workflow.
          </p>
        </div>
        <FooterCol
          title="Explore"
          links={[
            { to: "/tools", label: "All Tools" },
            { to: "/categories", label: "Categories" },
            { to: "/compare", label: "Compare" },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { to: "/about", label: "About" },
            { to: "/contact", label: "Contact" },
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            { to: "/privacy", label: "Privacy" },
            { to: "/terms", label: "Terms" },
          ]}
        />
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Khozoai. All rights reserved.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <div className="mb-3 text-sm font-semibold tracking-tight">{title}</div>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
