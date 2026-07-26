import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Trophy, ShieldHalf, LayoutGrid, Swords, Award, Settings } from "lucide-react";
import { GoalCelebration } from "@/components/match/GoalCelebration";
import { LiveTicker } from "@/components/match/LiveTicker";

const nav = [
  { to: "/", label: "Home", icon: Trophy },
  { to: "/matches", label: "Matches", icon: Swords },
  { to: "/groups", label: "Groups", icon: LayoutGrid },
  { to: "/knockout", label: "Knockout", icon: ShieldHalf },
  { to: "/awards", label: "Awards", icon: Award },
  { to: "/admin", label: "Admin", icon: Settings },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen w-full flex flex-col">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-accent/20 relative">
        <div className="absolute inset-x-0 top-0 h-[3px] ribbon-strip" />
        <div className="absolute inset-0 pitch-stripes opacity-60 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-md gold-frame flex items-center justify-center shadow-lg shadow-black/40 relative overflow-hidden">
              <span className="ball-spin text-lg" aria-hidden>⚽</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-black tracking-wide flex items-center gap-1.5">
                <span className="gold-shimmer-text">eFootball CUP</span>
                <span className="trophy-glow text-[10px]">🏆</span>
              </div>
              <div className="text-[9px] text-accent/80 uppercase tracking-[0.25em]">World Tournament</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => {
              const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-semibold uppercase tracking-wide transition-all",
                    active
                      ? "bg-gradient-to-b from-accent/20 to-accent/5 text-accent border border-accent/30 shadow-inner"
                      : "text-muted-foreground hover:text-accent hover:bg-surface",
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>


      <LiveTicker />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8">{children}</main>
      <GoalCelebration />

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/90 backdrop-blur-xl">
        <div className="grid grid-cols-6">
          {nav.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex flex-col items-center justify-center py-2 text-[10px] gap-0.5",
                  active ? "text-accent" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="wc-banner mb-6 p-5 md:p-7">
      <div className="absolute inset-x-0 top-0 h-1 ribbon-strip opacity-90" />
      <div className="absolute inset-0 confetti-dots opacity-30 pointer-events-none" aria-hidden />
      <div className="relative flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-accent/90 mb-2 flex items-center gap-2">
            <span className="trophy-glow">🏆</span>
            <span className="inline-block h-[2px] w-8 bg-accent/70 rounded-full" />
            FIFA eFootball · Matchday
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight gold-shimmer-text">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-white/70 mt-2 max-w-xl">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
    </div>
  );
}

