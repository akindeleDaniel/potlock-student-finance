import { Home, Receipt, ShieldAlert, TrendingUp, Wallet } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { cn } from "../lib/utils";
import { ConnectButton } from "./ConnectButton";

const links = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/money-in", label: "Money in", icon: Wallet, end: false },
  { to: "/spend", label: "Spend", icon: Receipt, end: false },
  { to: "/emergency", label: "Emergency", icon: ShieldAlert, end: false },
  { to: "/report", label: "Report", icon: TrendingUp, end: false },
];

/** Top bar for wider screens, a thumb-high tab bar for phones, and the demo footer. */
export function Layout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <NavLink to="/" end className="flex items-center gap-2.5" aria-label="Kudi home">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground" aria-hidden="true">
              <Wallet className="size-4" />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-foreground">Kudi</span>
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-accent">
              Demo
            </span>
          </NavLink>

          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                    isActive ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            </nav>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pt-10 md:pb-16">
        <Outlet />
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-24 pt-2 sm:px-6 md:pb-8">
        <p className="border-t border-border pt-5 text-sm text-muted-foreground">
          Kudi keeps your purse amounts on this device. Connecting a wallet does not move any money.
        </p>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden" aria-label="Main">
        <ul className="mx-auto flex max-w-md items-stretch justify-between px-1">
          {links.map((link) => (
            <li key={link.to} className="flex-1">
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                    isActive ? "text-accent" : "text-muted-foreground",
                  )
                }
              >
                <link.icon className="size-5" aria-hidden="true" />
                <span>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default Layout;
